import { randomUUID } from 'node:crypto';
import type { FounderDb } from '@/lib/db';
import type { LlmToolSpec } from '@/lib/connectors/llm';
import type { AgentRun, Broadcast } from '@/lib/schemas';

export type AgentRunResult = { ok: boolean; summary: string; data?: unknown };

export type RuntimeAgent = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  run(): Promise<AgentRunResult>;
  /**
   * Optional conversational entry point used by broadcasts. Agents that can
   * actually act on a message (e.g. the data agent querying G-Brain)
   * implement this; everyone else falls back to run() and replies with live
   * status. A future OpenClaw/Claude Code binding plugs in here.
   */
  respond?(message: string): Promise<AgentRunResult>;
  /**
   * Read-only tools this agent can call during a chat. Each wraps an existing
   * connector so the model can actually read live data mid-conversation.
   */
  chatTools?(): LlmToolSpec[];
};

export function createRuntime(db: FounderDb, agents: RuntimeAgent[]) {
  const registry = new Map(agents.map((a) => [a.id, a]));

  return {
    list(): RuntimeAgent[] {
      return [...registry.values()];
    },

    async run(id: string): Promise<AgentRun> {
      const agent = registry.get(id);
      if (!agent) throw new Error(`unknown agent: ${id}`);
      const startedAt = new Date().toISOString();
      let result: AgentRunResult;
      try {
        result = await agent.run();
      } catch (err) {
        result = { ok: false, summary: err instanceof Error ? err.message : String(err) };
      }
      const run: AgentRun = {
        id: randomUUID(),
        agentId: id,
        startedAt,
        finishedAt: new Date().toISOString(),
        ok: result.ok,
        summary: result.summary,
      };
      db.agentRuns.insert(run);
      return run;
    },

    /** Speak to every agent at once; each replies in parallel. */
    async broadcast(message: string): Promise<Broadcast> {
      const broadcastId = randomUUID();
      const createdAt = new Date().toISOString();
      db.broadcasts.insert({ id: broadcastId, message, createdAt });

      const replies = await Promise.all(
        [...registry.values()].map(async (agent) => {
          let result: AgentRunResult;
          try {
            result = await (agent.respond ? agent.respond(message) : agent.run());
          } catch (err) {
            result = { ok: false, summary: err instanceof Error ? err.message : String(err) };
          }
          const reply = {
            id: randomUUID(),
            broadcastId,
            agentId: agent.id,
            ok: result.ok,
            reply: result.summary,
            finishedAt: new Date().toISOString(),
          };
          db.broadcasts.insertReply(reply);
          // Persist the exchange so agents have an auditable learning trail.
          // This is memory, not silent model retraining or permission escalation.
          db.agentMessages.insert({
            id: randomUUID(),
            agentId: agent.id,
            role: 'user',
            content: message,
            toolCalls: [],
            createdAt,
          });
          db.agentMessages.insert({
            id: randomUUID(),
            agentId: agent.id,
            role: 'assistant',
            content: result.summary,
            toolCalls: [],
            createdAt: reply.finishedAt,
          });
          return reply;
        }),
      );

      return { id: broadcastId, message, createdAt, replies };
    },
  };
}

export type AgentRuntime = ReturnType<typeof createRuntime>;

/**
 * AI-powered agent call with automatic provider rotation
 * This function can be used by agents to make LLM calls with fallback
 */
import { callLLMWithRotation, getProviderStatus } from '@/lib/ai-rotation'
import { getAIRotationState } from '@/lib/ai-agent-provider'

export async function callAgentLLM(
  prompt: string,
  options?: {
    maxTokens?: number
    temperature?: number
    retryCount?: number
  }
): Promise<string> {
  const state = getAIRotationState()
  return callLLMWithRotation(state, prompt, options)
}

export function getAgentLLMStatus(): Array<{
  name: string
  status: 'active' | 'rate_limited' | 'error' | 'inactive'
  usage: string
  model: string
  lastError?: string
}> {
  const state = getAIRotationState()
  return getProviderStatus(state)
}
