/**
 * LLM connector — backs agent & Conductor chat through the Vercel AI Gateway.
 *
 * Mirrors the brain.ts provider shape: a real `gateway` provider (default) that
 * calls the AI SDK with a `"provider/model"` string, plus a `stub` provider
 * (LLM_PROVIDER=stub) that is deterministic and makes NO network call — so the
 * whole agent-chat stack is testable offline. Status stays honest: no
 * AI_GATEWAY_API_KEY ⇒ not_configured, never a fake "connected".
 */
import { z } from 'zod';
import { CRED_FILES, resolveCred } from '@/lib/creds';
import type { ConnectorStatus } from '@/lib/connectors/types';

export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';
export type LlmMessage = { role: LlmRole; content: string };

export type LlmToolSpec = {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export type LlmToolCall = { name: string; args: unknown; result: unknown };

export type LlmChatRequest = {
  system?: string;
  messages: LlmMessage[];
  tools?: LlmToolSpec[];
  model?: string;
};

export type LlmChatResult = { text: string; toolCalls: LlmToolCall[] };

export interface LlmProvider {
  name: string;
  chat(req: LlmChatRequest): Promise<LlmChatResult>;
}

const GATEWAY_KEY = 'AI_GATEWAY_API_KEY';
const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'anthropic/claude-sonnet-5';

/** process.env first (Next auto-loads .env.local), then Alex's cred files. */
function resolveGatewayKey(): string | undefined {
  return resolveCred(GATEWAY_KEY, [CRED_FILES.agentsEnv, CRED_FILES.socialMedia]);
}

/** Stub trigger: a user message containing `use-tool:<name>` fires that tool. */
const STUB_TRIGGER = /use-tool:(\S+)/;

export const stubLlmProvider: LlmProvider = {
  name: 'stub',
  async chat(req) {
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const text = lastUser ? `stub-reply: ${lastUser.content}` : 'stub-reply';
    const toolCalls: LlmToolCall[] = [];
    const trigger = lastUser?.content.match(STUB_TRIGGER);
    if (trigger && req.tools) {
      const spec = req.tools.find((t) => t.name === trigger[1]);
      if (spec) {
        const args: Record<string, unknown> = {};
        const result = await spec.execute(args);
        toolCalls.push({ name: spec.name, args, result });
      }
    }
    return { text, toolCalls };
  },
};

export function createGatewayProvider(model: string = DEFAULT_MODEL): LlmProvider {
  return {
    name: 'gateway',
    async chat(req) {
      // Fail fast with an honest message instead of letting the SDK hang —
      // and hydrate process.env from Alex's cred files so a key that
      // exists outside .env.local still works.
      const key = resolveGatewayKey();
      if (!key) {
        throw new Error('AI_GATEWAY_API_KEY is not set — add it to .env.local to enable agent chat.');
      }
      if (!process.env.AI_GATEWAY_API_KEY) process.env.AI_GATEWAY_API_KEY = key;
      const { generateText, tool, stepCountIs, gateway } = await import('ai');
      const tools = Object.fromEntries(
        (req.tools ?? []).map((t) => [
          t.name,
          tool({ description: t.description, inputSchema: t.parameters, execute: t.execute }),
        ]),
      );
      const messages = req.messages
        .filter((m) => m.role !== 'tool')
        .map((m) => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content }));

      const result = await generateText({
        model: gateway(req.model ?? model),
        system: req.system,
        messages,
        tools: req.tools?.length ? tools : undefined,
        stopWhen: stepCountIs(6),
      });

      const toolCalls: LlmToolCall[] = [];
      for (const step of result.steps ?? []) {
        const calls = step.toolCalls ?? [];
        const results = step.toolResults ?? [];
        for (const c of calls) {
          // Match the result to its call by id — a failed/missing tool result
          // can leave `toolResults` shorter than `toolCalls`, so positional
          // alignment would attach the wrong output to every later call.
          const hit = results.find((r) => r.toolCallId === c.toolCallId);
          toolCalls.push({ name: c.toolName, args: c.input, result: hit?.output });
        }
      }
      return { text: result.text, toolCalls };
    },
  };
}

export function getLlmProvider(): LlmProvider {
  if (process.env.OPENAI_API_KEY) return createOpenAIProvider();
  if (process.env.LLM_PROVIDER === 'failover' || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.AI_BASE_URL || process.env.OMNIROUTE_BASE_URL) return createFailoverProvider();
  const name = process.env.LLM_PROVIDER ?? 'gateway';
  if (name === 'stub') return stubLlmProvider;
  return createGatewayProvider();
}

/** Direct OpenAI provider with native AI SDK tool execution. */
export function createOpenAIProvider(): LlmProvider {
  return { name: 'OpenAI', async chat(req) {
    const { generateText, tool, stepCountIs } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });
    const tools = Object.fromEntries((req.tools ?? []).map((t) => [t.name, tool({ description: t.description, inputSchema: t.parameters, execute: t.execute })]));
    const result = await generateText({
      // AI SDK v6 currently expects a v2 model type while the latest provider
      // package exposes v4; the provider is runtime-compatible here.
      model: openai.chat(req.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini') as never,
      system: req.system,
      messages: req.messages.filter((m) => m.role !== 'tool').map((m) => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
      tools: req.tools?.length ? tools : undefined,
      stopWhen: stepCountIs(6),
    });
    const toolCalls: LlmToolCall[] = [];
    for (const step of result.steps ?? []) for (const call of step.toolCalls ?? []) {
      const hit = (step.toolResults ?? []).find((item) => item.toolCallId === call.toolCallId);
      toolCalls.push({ name: call.toolName, args: call.input, result: hit?.output });
    }
    return { text: result.text, toolCalls };
  }};
}

/** OpenAI-compatible failover chain. A provider is skipped on quota, rate-limit,
 * timeout, or any HTTP failure; the next configured provider gets the request. */
export function createFailoverProvider(): LlmProvider {
  return { name: 'failover', async chat(req) {
    const candidates = [
      process.env.OMNIROUTE_BASE_URL && { name: 'OmniRoute', url: `${process.env.OMNIROUTE_BASE_URL.replace(/\/$/, '')}/chat/completions`, key: process.env.OMNIROUTE_API_KEY ?? '', model: process.env.OMNIROUTE_MODEL ?? process.env.AI_MODEL ?? 'local-model' },
      // Prefer the user's direct OpenAI connection when it is configured.
      // This keeps G-Brain/agent chat independent of the optional gateway.
      process.env.OPENAI_API_KEY && { name: 'OpenAI', url: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini' },
      process.env.OPENROUTER_API_KEY && { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini' },
      process.env.GROQ_API_KEY && { name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile' },
      process.env.CEREBRAS_API_KEY && { name: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', key: process.env.CEREBRAS_API_KEY, model: process.env.CEREBRAS_MODEL ?? 'llama-3.3-70b' },
      process.env.TOGETHER_API_KEY && { name: 'Together', url: 'https://api.together.xyz/v1/chat/completions', key: process.env.TOGETHER_API_KEY, model: process.env.TOGETHER_MODEL ?? 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      process.env.MISTRAL_API_KEY && { name: 'Mistral', url: 'https://api.mistral.ai/v1/chat/completions', key: process.env.MISTRAL_API_KEY, model: process.env.MISTRAL_MODEL ?? 'mistral-small-latest' },
      process.env.DEEPSEEK_API_KEY && { name: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', key: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat' },
      process.env.FIREWORKS_API_KEY && { name: 'Fireworks', url: 'https://api.fireworks.ai/inference/v1/chat/completions', key: process.env.FIREWORKS_API_KEY, model: process.env.FIREWORKS_MODEL ?? 'accounts/fireworks/models/llama-v3p1-8b-instruct' },
      process.env.AI_BASE_URL && { name: 'Custom AI', url: `${process.env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, key: process.env.AI_API_KEY ?? '', model: process.env.AI_MODEL ?? 'local-model' },
      process.env.OLLAMA_BASE_URL && { name: 'Ollama', url: `${process.env.OLLAMA_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`, key: '', model: process.env.OLLAMA_MODEL ?? 'llama3.1' },
    ].filter(Boolean) as Array<{ name: string; url: string; key: string; model: string }>;
    let last = 'no providers configured';
    for (const provider of candidates) { try {
      const response = await fetch(provider.url, { method: 'POST', headers: { 'content-type': 'application/json', ...(provider.key ? { authorization: `Bearer ${provider.key}` } : {}) }, body: JSON.stringify({ model: req.model ?? provider.model, messages: [{ role: 'system', content: req.system ?? '' }, ...req.messages.filter((m) => m.role !== 'tool').map((m) => ({ role: m.role, content: m.content }))] }), signal: AbortSignal.timeout(30000) });
      if (!response.ok) { last = `${provider.name} HTTP ${response.status}`; continue; }
      const body = await response.json(); const text = body.choices?.[0]?.message?.content;
      if (typeof text !== 'string') { last = `${provider.name} returned no text`; continue; }
      return { text, toolCalls: [] };
    } catch (error) { last = `${provider.name}: ${error instanceof Error ? error.message : String(error)}`; } }
    throw new Error(`AI failover exhausted: ${last}`);
  } };
}

export function chat(req: LlmChatRequest): Promise<LlmChatResult> {
  return getLlmProvider().chat(req);
}

export async function llmStatus(): Promise<ConnectorStatus> {
  const base = { id: 'llm', name: 'LLM (OpenAI / Gateway)', kind: 'orchestration' } as const;
  if (process.env.LLM_PROVIDER === 'stub') {
    return { ...base, state: 'connected', detail: 'stub provider active (tests)' };
  }
  const key = resolveGatewayKey();
  if (process.env.OPENAI_API_KEY) {
    return { ...base, state: 'connected', detail: `OpenAI · ${process.env.OPENAI_MODEL ?? 'gpt-4o-mini'} · agent failover enabled` };
  }
  if (!key) {
    return {
      ...base,
      state: 'not_configured',
      detail: 'Set AI_GATEWAY_API_KEY in .env.local to enable agent chat via the Vercel AI Gateway.',
    };
  }
  return { ...base, state: 'connected', detail: `Vercel AI Gateway · default model ${DEFAULT_MODEL}` };
}
