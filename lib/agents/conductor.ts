/**
 * Conductor routing. A message can name its target explicitly with a leading
 * `@<agentId|name>`; otherwise the model picks the best-fit agent from the
 * roster. Either way the Conductor delegates to that agent's chat (with its
 * tools) and returns `{ routedTo, ...chat }`. Routing never throws on a bad
 * `@name` — it falls back to model routing.
 */
import { chat as llmChat } from '@/lib/connectors/llm';
import { chatWithAgent, type ChatResult } from '@/lib/agents/chat';
import type { FounderDb } from '@/lib/db';
import type { RuntimeAgent } from '@/lib/agents/runtime';

export type ConductorResult = ChatResult & { routedTo: string };

const AT_PREFIX = /^@(\S+)\s*/;

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function matchAgent(agents: RuntimeAgent[], token: string): RuntimeAgent | undefined {
  const t = slug(token);
  return agents.find((a) => a.id === token || a.id === t || slug(a.name) === t);
}

/** Ask the model for the single best-fit agent id; fall back to the first agent. */
async function pickAgent(routable: RuntimeAgent[], message: string): Promise<string> {
  const roster = routable.map((a) => `- ${a.id}: ${a.name} — ${a.description}`).join('\n');
  const system = [
    'You are the Conductor, the router for Founder OS operator agents.',
    'Pick the single best-fit agent for the user message.',
    'Reply with ONLY that agent id and nothing else. Options:',
    roster,
  ].join('\n');
  try {
    const res = await llmChat({ system, messages: [{ role: 'user', content: message }] });
    const picked = (res.text.trim().split(/\s+/)[0] ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
    const found = routable.find((a) => a.id === picked);
    if (found) return found.id;
  } catch {
    // Routing must remain usable when an LLM provider is rate-limited or out
    // of credits. Use a deterministic capability fallback instead of a 500.
  }
  const text = message.toLowerCase();
  if (/(audit|all agents|every agent|each agent|roster|who can you communicate)/.test(text) && routable.some((a) => a.id === 'data-agent')) return 'data-agent';
  const keywords: Array<[string[], string]> = [
    [['calendar', 'meeting', 'schedule', 'appointment'], 'calendar-agent'],
    [['email', 'gmail', 'inbox', 'mail'], 'gmail-worker'],
    [['brain', 'knowledge', 'note', 'memory'], 'data-agent'],
    [['social', 'instagram', 'facebook', 'post'], 'social-agent'],
    [['slack'], 'slack-worker'],
  ];
  for (const [terms, id] of keywords) if (terms.some((term) => text.includes(term)) && routable.some((a) => a.id === id)) return id;
  return routable[0]?.id ?? 'conductor';
}

export async function routeConductorMessage(
  db: FounderDb,
  agents: RuntimeAgent[],
  message: string,
  opts: { screenContext?: string; brainChatId?: string } = {},
): Promise<ConductorResult> {
  const routable = agents.filter((a) => a.id !== 'conductor');
  let targetId: string | undefined;
  let delivered = message;

  // Deterministic safety rail for roster/audit requests. These must reach the
  // Data Agent's live audit tool and must never be left to model routing.
  if (/(audit|all agents|every agent|each agent|roster|who can you communicate)/i.test(message)) {
    const auditor = routable.find((agent) => agent.id === 'data-agent');
    if (auditor) targetId = auditor.id;
  }

  // Requests to bring site content into Website Builder must reach the CMS
  // specialist. Its chat path executes the real, read-only WordPress import;
  // leaving this to model routing can send the request to an unrelated
  // catalog agent that cannot access the CMS connector.
  const isWordPressContentImport =
    /(download|import|sync|copy|pull|bring|fetch|retrieve)/i.test(message) &&
    /(wordpress|content|pages?|posts?|website builder|site|builder|drafts?)/i.test(message);
  if (!targetId && isWordPressContentImport) {
    const cms = routable.find((agent) => agent.id === 'agency-engineering-cms-developer');
    if (cms) targetId = cms.id;
  }

  // WordPress connection and CMS questions must reach the CMS specialist so
  // its live connector check is available instead of relying on model routing.
  if (!targetId && /(wordpress|wp-json|cms)/i.test(message)) {
    const cms = routable.find((agent) => agent.id === 'agency-engineering-cms-developer');
    if (cms) targetId = cms.id;
  }

  // Finance requests belong to the reusable Accounting Controller. This rail
  // keeps readiness and tax/bank limitations grounded in live data instead of
  // letting a general-purpose model invent an accounting answer.
  if (!targetId && /(accounting|bookkeep|tax|reconcil|ledger|financial statement|profit and loss|\bp&l\b|bank account|cash flow)/i.test(message)) {
    const accountant = routable.find((agent) => agent.id === 'accounting-controller');
    if (accountant) targetId = accountant.id;
  }

  // Broad system-connection questions belong to G-Brain's live connector
  // audit, so the user gets one complete report instead of fixing integrations
  // one at a time through unrelated specialists.
  const isFullConnectionCheck = /(?:full|complete)\s+(?:connection\s+)?(?:test|check)|full\s+test|what\s+can\s+you\s+connect|all\s+components/i.test(message);
  if (!targetId && (
    (/(connect|connected|connection|connector|integration|tool|working|health|status|audit)/i.test(message)
      && /(all|everything|every|system|tools|connectors|integrations)/i.test(message))
    || isFullConnectionCheck
  )) {
    const auditor = routable.find((agent) => agent.id === 'data-agent');
    if (auditor) targetId = auditor.id;
  }

  const at = message.match(AT_PREFIX);
  if (!targetId && at) {
    const explicit = matchAgent(routable, at[1]);
    if (explicit) {
      targetId = explicit.id;
      delivered = message.replace(AT_PREFIX, '').trim() || message;
    }
    // unknown @name → fall through to model routing (never throw)
  }

  if (!targetId) targetId = await pickAgent(routable, message);

  const result = await chatWithAgent(db, agents, targetId, delivered, opts);
  return { routedTo: targetId, ...result };
}
