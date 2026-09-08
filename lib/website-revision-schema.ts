import { z } from 'zod';
import { PageAffiliateOfferSchema } from '@/lib/website-affiliates';

export const WebsiteRevisionSchema = z.object({
  id: z.string(), html: z.string().max(2_000_000), hash: z.string(),
  kind: z.enum(['source', 'agent', 'manual']), createdAt: z.string(), parentId: z.string().optional(),
  approvedHash: z.string().optional(), approvedAt: z.string().optional(), stagedHash: z.string().optional(),
  contentChanges: z.array(z.string()).default([]),
  appliedEdits: z.array(z.object({ before: z.string(), after: z.string() })).default([]),
  designChanges: z.array(z.string()).default([]),
  mediaChanges: z.array(z.string()).default([]),
  seo: z.array(z.string()).default([]),
  affiliateProposals: z.array(z.string()).default([]),
  affiliateOffers: z.array(PageAffiliateOfferSchema).default([]),
  warnings: z.array(z.string()).default([]),
  qa: z.object({ status: z.enum(['not_run', 'passed', 'needs_review', 'failed']), summary: z.string(), checks: z.array(z.string()) }).default({ status: 'not_run', summary: 'QA has not run.', checks: [] }),
  status: z.enum(['source', 'draft', 'needs_review', 'approved', 'rejected', 'staged', 'published']).default('draft'),
});
export const WebsiteLifecycleSchema = z.object({
  projectId: z.string().min(1), pagePath: z.string().min(1), version: z.number().int().default(0),
  sourceRoot: z.string().optional(), sourceHashes: z.record(z.string()).default({}),
  selectedId: z.string().optional(), stagedId: z.string().optional(), publishedId: z.string().optional(),
  revisions: z.array(WebsiteRevisionSchema),
  runs: z.array(z.object({ id: z.string(), status: z.enum(['running', 'completed', 'failed']), request: z.string(),
    startedAt: z.string(), finishedAt: z.string().optional(), error: z.string().optional(),
    brain: z.unknown().optional(), results: z.array(z.object({ agentId: z.string(), reply: z.string(), createdAt: z.string() })),
    revisionId: z.string().optional(),
  })),
  releases: z.array(z.object({ revisionId: z.string(), revisionHash: z.string().optional(), build: z.string().optional(), url: z.string().optional(), action: z.enum(['publish', 'rollback']), at: z.string() })),
});
export type WebsiteLifecycle = z.infer<typeof WebsiteLifecycleSchema>;
