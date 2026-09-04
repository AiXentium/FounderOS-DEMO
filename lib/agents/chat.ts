/**
 * Per-agent chat orchestration. Loads the agent's rolling conversation, calls
 * the LLM connector with the agent's system prompt + its read-only tools, and
 * persists the user turn, any tool calls, and the assistant turn. Returns the
 * reply plus the full conversation. The LLM_PROVIDER=stub path keeps this
 * deterministic and offline for tests.
 */
import { randomUUID } from 'node:crypto';
import { chat as llmChat, type LlmMessage } from '@/lib/connectors/llm';
import type { FounderDb } from '@/lib/db';
import type { RuntimeAgent } from '@/lib/agents/runtime';
import type { AgentMessage } from '@/lib/schemas';
import { getBrainProvider } from '@/lib/brain';
import { wordPressStatus } from '@/lib/connectors/wordpress';
import { runtimeEnv } from '@/lib/creds';
import { allConnectorStatuses } from '@/lib/connectors';
import { syncAccountingControllerActivation } from '@/lib/accounting-controller';
import { importWordPressContent } from '@/lib/wordpress-import';

export type ChatResult = { reply: string; messages: AgentMessage[] };

const SCREEN_CONTEXT_CAP = 4000;

export function systemPromptFor(agent: RuntimeAgent, screenContext?: string, brainContext?: string): string {
  const lines = [
    `You are ${agent.name}, an operator agent inside Founder OS.`,
    agent.description,
    'Answer concisely and use your tools to read live data when it helps.',
    'You may execute explicitly requested local-draft imports through a provided tool. Never claim to have changed, published, or deleted external content without a successful tool result and approval.',
    'OpenPage is a separate JSON workspace. Use its tools for real draft work, save its memory under the openpage/ G-Brain namespace, and never imply an OpenPage draft was published to WordPress unless the WordPress connector reports a successful approved action.',
  ];
  if (screenContext) {
    lines.push(
      `The operator is currently looking at this screen — use it as grounding when they say "this", "here", or ask about what they see:\n${screenContext.slice(0, SCREEN_CONTEXT_CAP)}`,
    );
  }
  if (brainContext) {
    lines.push(`Relevant shared G-Brain notes for this request (read-only grounding):\n${brainContext.slice(0, SCREEN_CONTEXT_CAP)}`);
  }
  return lines.join('\n');
}

export async function chatWithAgent(
  db: FounderDb,
  agents: RuntimeAgent[],
  agentId: string,
  message: string,
  opts: { screenContext?: string; brainChatId?: string } = {},
): Promise<ChatResult> {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) throw new Error(`unknown agent: ${agentId}`);

  const now = () => new Date().toISOString();

  db.agentMessages.insert({ id: randomUUID(), agentId, role: 'user', content: message, toolCalls: [], createdAt: now() });

  // Full rolling history. Prior `tool` turns are kept in the record for the
  // activity feed, but the gateway provider drops them before calling the model
  // (a bare {role:'tool'} string isn't a valid v6 tool-result part) — so on
  // follow-up turns the model sees the assistant's prose, not raw tool output.
  // Fine for v1 read-only chat; revisit if multi-turn tool reasoning is needed.
  const history = opts.brainChatId
    ? db.brainChats.messages(opts.brainChatId).map((m) => ({ role: m.role, content: m.content })).concat({ role: 'user' as const, content: message })
    : db.agentMessages.byAgent(agentId).map((m) => ({ role: m.role, content: m.content }));
  const llmMessages: LlmMessage[] = history;
  const tools = agent.chatTools?.();

  let brainContext = '';
  try {
    const notes = await getBrainProvider().search(message);
    brainContext = notes
      .slice(0, 5)
      .map((note) => `${note.title}: ${note.snippet}`)
      .join('\n');
  } catch {
    // The brain connector has its own local fallback; an unavailable brain
    // must never prevent an agent from using its primary connector.
  }
  const isAudit = agentId === 'data-agent' && /(audit|all agents|every agent|each agent|roster|who can you communicate)/i.test(message);
  const isBrainStatus = agentId === 'data-agent' && /(g[- ]?brain|brain).*(status|active|working|connected|health)|is the brain/i.test(message);
  const isWordPressConnectionCheck = agentId === 'agency-engineering-cms-developer'
    && /(wordpress|wp-json|cms)/i.test(message)
    && /(connect|connected|access|status|health|check|work)/i.test(message);
  const isWordPressContentImport = ['data-agent', 'agency-engineering-cms-developer'].includes(agentId)
    && /(download|import|sync|copy|pull|bring)/i.test(message)
    && /(wordpress|content|pages?|posts?)/i.test(message);
  const isConnectorAudit = agentId === 'data-agent' && (
    (/(connect|connected|connection|connector|integration|tool|working|health|status|audit)/i.test(message)
      && /(all|everything|every|system|tools|connectors|integrations)/i.test(message))
    || /(?:full|complete)\s+(?:connection\s+)?(?:test|check)|full\s+test|what\s+can\s+you\s+connect|all\s+components/i.test(message)
  );
  const isAccountingStatus = agentId === 'accounting-controller' && /(accounting|bookkeep|tax|reconcil|ledger|financial statement|profit and loss|\bp&l\b|bank account|cash flow|active|working|ready|status|audit)/i.test(message);

  // Operational checks must not depend on an LLM provider being available.
  if (isBrainStatus) {
    const status = await getBrainProvider().status();
    const reply = `Live G-Brain status: ${status.connected ? 'CONNECTED' : 'DISCONNECTED'} — ${status.detail}`;
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `getGBrainStatus → ${JSON.stringify(status)}`, toolCalls: [{ name: 'getGBrainStatus', args: {}, result: status }], createdAt: now() });
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
    return { reply, messages: db.agentMessages.byAgent(agentId) };
  }
  if (isWordPressContentImport) {
    try {
      const imported = await importWordPressContent(db);
      const reply = `${imported.summary} Open Website Builder → Saved project to review and edit each imported item. The import is local and read-only against WordPress.`;
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `importWordPressContent → ${JSON.stringify(imported)}`, toolCalls: [{ name: 'importWordPressContent', args: {}, result: imported }], createdAt: now() });
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
      return { reply, messages: db.agentMessages.byAgent(agentId) };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const reply = `WordPress content import did not complete: ${detail}. No WordPress content was changed.`;
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `importWordPressContent → ERROR ${detail}`, toolCalls: [{ name: 'importWordPressContent', args: {}, result: { ok: false, error: detail } }], createdAt: now() });
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
      return { reply, messages: db.agentMessages.byAgent(agentId) };
    }
  }
  if (isAudit) {
    const entries = agents.filter((entry) => entry.id !== 'conductor').map((entry) => ({ id: entry.id, name: entry.name, description: entry.description, canRun: typeof entry.run === 'function', canRespond: typeof entry.respond === 'function', chatTools: entry.chatTools?.().map((tool) => tool.name) ?? [] }));
    const reply = `Live runtime audit: ${entries.length} agents loaded. These are the actual runtime agents, not seed/mock records:\n${entries.map((entry) => `- ${entry.name} (${entry.id}): ${entry.description} | run=${entry.canRun ? 'yes' : 'no'} respond=${entry.canRespond ? 'yes' : 'no'} tools=${entry.chatTools.join(', ') || 'none'}`).join('\n')}`;
    const audit = { total: entries.length, agents: entries };
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `auditRuntimeAgents → ${JSON.stringify(audit)}`, toolCalls: [{ name: 'auditRuntimeAgents', args: {}, result: audit }], createdAt: now() });
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
    return { reply, messages: db.agentMessages.byAgent(agentId) };
  }
  if (isWordPressConnectionCheck) {
    const status = await wordPressStatus(runtimeEnv());
    const siteUrl = typeof status.meta?.siteUrl === 'string' ? ` (${status.meta.siteUrl})` : '';
    const reply = status.state === 'connected'
      ? `Live WordPress connection: CONNECTED${siteUrl} — ${status.detail}. I can inspect the site through the WordPress connector. Content edits, deletes, and publishing remain approval-gated.`
      : `Live WordPress connection: ${status.state.toUpperCase()}${siteUrl} — ${status.detail}. Royal MCP is a separate connector and does not replace WordPress REST permissions.`;
    const call = { name: 'checkWordPressConnection', args: {}, result: status };
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `${call.name} → ${JSON.stringify(status)}`, toolCalls: [call], createdAt: now() });
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
    return { reply, messages: db.agentMessages.byAgent(agentId) };
  }
  if (isConnectorAudit) {
    const statuses = await allConnectorStatuses();
    const connected = statuses.filter((status) => status.state === 'connected');
    const notConfigured = statuses.filter((status) => status.state === 'not_configured');
    const errors = statuses.filter((status) => status.state === 'error');
    const reply = [
      `Live connector audit: ${connected.length}/${statuses.length} connected; ${errors.length} error${errors.length === 1 ? '' : 's'}; ${notConfigured.length} not configured.`,
      connected.length ? `Connected: ${connected.map((status) => status.name).join(', ')}.` : '',
      errors.length ? `Needs repair: ${errors.map((status) => `${status.name} — ${status.detail}`).join(' | ')}.` : '',
      notConfigured.length ? `Needs setup: ${notConfigured.map((status) => `${status.name} — ${status.detail}`).join(' | ')}.` : '',
      'The Brain can now check the full connector set in one pass; each specialist remains limited to its approved tools and write actions still require approval.',
    ].filter(Boolean).join('\n');
    const audit = { checkedAt: new Date().toISOString(), total: statuses.length, connected: connected.length, errors: errors.length, notConfigured: notConfigured.length, statuses };
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `auditAllConnectors → ${JSON.stringify(audit)}`, toolCalls: [{ name: 'auditAllConnectors', args: {}, result: audit }], createdAt: now() });
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
    return { reply, messages: db.agentMessages.byAgent(agentId) };
  }
  if (isAccountingStatus) {
    const readiness = syncAccountingControllerActivation(db);
    const configuredProcessors = readiness.paymentProcessors.filter((processor) => processor.configured).map((processor) => processor.name);
    const reply = [
      `Accounting Controller: ${readiness.active ? 'ACTIVE' : 'PLANNED'} for ${readiness.profile.sector === 'travel-agency' ? 'this travel agency' : readiness.profile.businessName}.`,
      `Shared G-Brain: CONNECTED — ${readiness.brain.detail}`,
      `Payment processors: ${configuredProcessors.length ? configuredProcessors.join(', ') : 'none configured'}.`,
      `Bank feed: ${readiness.bankFeed.state.toUpperCase()} — ${readiness.bankFeed.detail}`,
      `Statement data: ${readiness.statementData.detail} Ledger: ${readiness.ledger.detail}`,
      `Tax: ${readiness.tax.detail}`,
      `Travel capabilities: ${readiness.profile.capabilities.filter((capability) => /travel|affiliate|booking|supplier|currency/i.test(capability)).join('; ')}.`,
      readiness.nextSteps.length ? `Needs attention: ${readiness.nextSteps.join(' ')}` : 'No readiness gaps detected in the configured sources; posting and tax decisions remain approval-gated.',
    ].join('\n');
    const call = { name: 'auditAccountingReadiness', args: {}, result: readiness };
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `${call.name} → ${JSON.stringify(readiness)}`, toolCalls: [call], createdAt: now() });
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
    return { reply, messages: db.agentMessages.byAgent(agentId) };
  }
  if (agentId === 'viator-agent' && /(search|find|live).*(viator|activity|activities|tour|barcelona|travel)/i.test(message)) {
    const searchTool = tools?.find((tool) => tool.name === 'searchLiveViator');
    if (searchTool) {
      const query = message.match(/(?:for|in|about|query)\s+(.+)$/i)?.[1]?.trim() || message.replace(/use.*?tool/i, '').trim();
      const products = await searchTool.execute({ query: query || 'Barcelona travel' });
      const items = Array.isArray(products) ? products as Array<{ title?: string; name?: string; url?: string; description?: string }> : [];
      const reply = `Live Viator search completed for "${query || 'Barcelona travel'}" — ${items.length} results:\n${items.slice(0, 10).map((item, index) => `${index + 1}. ${item.title || item.name || 'Untitled'}${item.url ? ` — ${item.url}` : ''}${item.description ? `\n   ${item.description.slice(0, 180)}` : ''}`).join('\n')}`;
      const call = { name: 'searchLiveViator', args: { query: query || 'Barcelona travel' }, result: products };
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `${call.name} → ${JSON.stringify(products)}`, toolCalls: [call], createdAt: now() });
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
      return { reply, messages: db.agentMessages.byAgent(agentId) };
    }
  }

  const result = await llmChat({ system: systemPromptFor(agent, opts.screenContext, brainContext), messages: llmMessages, tools });

  // Roster audits are an operational read, not a creative answer. Guarantee
  // that the response reflects the loaded runtime rather than model memory.
  if (agentId === 'data-agent' && /(audit|all agents|every agent|each agent|roster|who can you communicate)/i.test(message)) {
    const audit = {
      total: agents.filter((entry) => entry.id !== 'conductor').length,
      builtinRuntime: agents.filter((entry) => entry.id !== 'conductor').length,
      agents: agents.filter((entry) => entry.id !== 'conductor').map((entry) => ({
        id: entry.id, name: entry.name, description: entry.description,
        canRun: typeof entry.run === 'function', canRespond: typeof entry.respond === 'function',
        chatTools: entry.chatTools?.().map((tool) => tool.name) ?? [],
      })),
    };
      const lines = audit.agents.map((entry) => `- ${entry.name} (${entry.id}): ${entry.description} | run=${entry.canRun ? 'yes' : 'no'} respond=${entry.canRespond ? 'yes' : 'no'} tools=${entry.chatTools.join(', ') || 'none'}`);
      const reply = `Live runtime audit: ${audit.total} agents loaded (${audit.builtinRuntime} builtin runtime agents). These are the actual loaded agents, not seed/mock records:\n${lines.join('\n')}`;
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `auditRuntimeAgents → ${JSON.stringify(audit)}`, toolCalls: [{ name: 'auditRuntimeAgents', args: {}, result: audit }], createdAt: now() });
      db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
      return { reply, messages: db.agentMessages.byAgent(agentId) };
  }

  if (agentId === 'data-agent' && /(g[- ]?brain|brain).*(status|active|working|connected|health)|is the brain/i.test(message)) {
    const status = await getBrainProvider().status();
    const reply = `Live G-Brain status: ${status.connected ? 'CONNECTED' : 'DISCONNECTED'} — ${status.detail}`;
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'tool', content: `getGBrainStatus → ${JSON.stringify(status)}`, toolCalls: [{ name: 'getGBrainStatus', args: {}, result: status }], createdAt: now() });
    db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: reply, toolCalls: [], createdAt: now() });
    return { reply, messages: db.agentMessages.byAgent(agentId) };
  }

  if (result.toolCalls.length) {
    db.agentMessages.insert({
      id: randomUUID(),
      agentId,
      role: 'tool',
      content: result.toolCalls.map((c) => `${c.name} → ${JSON.stringify(c.result)}`).join('\n'),
      toolCalls: result.toolCalls,
      createdAt: now(),
    });
  }

  db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: result.text, toolCalls: [], createdAt: now() });

  return { reply: result.text, messages: db.agentMessages.byAgent(agentId) };
}
