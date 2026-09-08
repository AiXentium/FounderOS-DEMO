import { z } from 'zod';

export const WebsiteRevisionSchema = z.object({
  id: z.string(), html: z.string().max(2_000_000), hash: z.string(),
  kind: z.enum(['source', 'agent', 'manual']), createdAt: z.string(), parentId: z.string().optional(),
  approvedHash: z.string().optional(), approvedAt: z.string().optional(), stagedHash: z.string().optional(),
});
export const WebsiteLifecycleSchema = z.object({
  projectId: z.string().min(1), pagePath: z.string().min(1), version: z.number().int().default(0),
  sourceRoot: z.string().optional(), sourceHashes: z.record(z.string()).default({}),
  selectedId: z.string().optional(), publishedId: z.string().optional(),
  revisions: z.array(WebsiteRevisionSchema),
  runs: z.array(z.object({ id: z.string(), status: z.enum(['running', 'completed', 'failed']), request: z.string(),
    startedAt: z.string(), finishedAt: z.string().optional(), error: z.string().optional(),
    brain: z.unknown().optional(), results: z.array(z.object({ agentId: z.string(), reply: z.string(), createdAt: z.string() })),
    revisionId: z.string().optional(),
  })),
  releases: z.array(z.object({ revisionId: z.string(), action: z.enum(['publish', 'rollback']), at: z.string() })),
});
export type WebsiteLifecycle = z.infer<typeof WebsiteLifecycleSchema>;
