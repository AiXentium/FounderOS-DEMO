import { z } from 'zod';
import { PageAffiliateOfferSchema } from '@/lib/website-affiliates';

export const WebsiteActorSchema = z.object({
  type: z.enum(['ai', 'human']),
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  at: z.string(),
});

export const WebsiteSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['hero', 'rich-text', 'image', 'gallery', 'highlights', 'cards', 'itinerary', 'affiliate', 'faq', 'cta', 'footer']),
  variant: z.enum(['standard', 'centered', 'split', 'grid', 'timeline', 'compact', 'feature']).default('standard'),
  eyebrow: z.string().max(160).optional(), heading: z.string().max(300).optional(), body: z.string().max(20000).optional(),
  image: z.object({ src: z.string().max(2000), alt: z.string().max(500) }).optional(),
  cta: z.object({ label: z.string().max(160), href: z.string().max(2000) }).optional(),
  items: z.array(z.object({ title: z.string().max(300), text: z.string().max(5000).optional(), href: z.string().max(2000).optional(), image: z.object({ src: z.string().max(2000), alt: z.string().max(500) }).optional() })).max(50).default([]),
  offerIds: z.array(z.string()).max(20).default([]), visible: z.boolean().default(true),
});

export const WebsitePageDocumentSchema = z.object({
  schemaVersion: z.literal(1), pagePath: z.string().min(1), title: z.string().min(1).max(300),
  templateId: z.string().min(1), pageType: z.enum(['standard', 'article', 'destination', 'campaign']).default('standard'),
  seo: z.object({ title: z.string().max(300), description: z.string().max(500), canonical: z.string().max(2000).optional(), noIndex: z.boolean().default(false) }),
  sections: z.array(WebsiteSectionSchema).max(100), createdAt: z.string(), updatedAt: z.string(),
});

export const WebsiteRevisionSchema = z.object({
  id: z.string(), html: z.string().max(2_000_000), hash: z.string(),
  pagePath: z.string().optional(),
  kind: z.enum(['source', 'agent', 'manual']), createdAt: z.string(), parentId: z.string().optional(),
  approvedHash: z.string().optional(), approvedAt: z.string().optional(), stagedHash: z.string().optional(),
  contentChanges: z.array(z.string()).default([]),
  appliedEdits: z.array(z.object({ before: z.string(), after: z.string() })).default([]),
  designChanges: z.array(z.string()).default([]),
  mediaChanges: z.array(z.string()).default([]),
  seo: z.array(z.string()).default([]),
  affiliateProposals: z.array(z.string()).default([]),
  affiliateOffers: z.array(PageAffiliateOfferSchema).default([]),
  document: WebsitePageDocumentSchema.optional(),
  attribution: WebsiteActorSchema.optional(),
  warnings: z.array(z.string()).default([]),
  qa: z.object({ status: z.enum(['not_run', 'passed', 'needs_review', 'failed']), summary: z.string(), checks: z.array(z.string()) }).default({ status: 'not_run', summary: 'QA has not run.', checks: [] }),
  status: z.enum(['source', 'draft', 'needs_review', 'approved', 'rejected', 'staged', 'published']).default('draft'),
});
export const WebsiteLifecycleSchema = z.object({
  projectId: z.string().min(1), pagePath: z.string().min(1), version: z.number().int().default(0),
  sourceRoot: z.string().optional(), sourceHashes: z.record(z.string()).default({}),
  selectedId: z.string().optional(), stagedId: z.string().optional(), publishedId: z.string().optional(),
  stagedPages: z.record(z.string()).default({}), publishedPages: z.record(z.string()).default({}),
  schedules: z.array(z.object({ id: z.string(), pagePath: z.string(), revisionId: z.string().optional(), action: z.enum(['publish', 'unpublish']), scheduledFor: z.string(), status: z.enum(['scheduled', 'completed', 'cancelled', 'failed']), attribution: WebsiteActorSchema, completedAt: z.string().optional(), error: z.string().optional() })).default([]),
  revisions: z.array(WebsiteRevisionSchema),
  runs: z.array(z.object({ id: z.string(), status: z.enum(['running', 'completed', 'failed']), request: z.string(),
    pagePath: z.string().optional(),
    startedAt: z.string(), finishedAt: z.string().optional(), error: z.string().optional(),
    brain: z.unknown().optional(), results: z.array(z.object({ agentId: z.string(), reply: z.string(), createdAt: z.string() })),
    revisionId: z.string().optional(),
  })),
  releases: z.array(z.object({ revisionId: z.string(), revisionHash: z.string().optional(), pageRevisions: z.record(z.string()).optional(), build: z.string().optional(), url: z.string().optional(), action: z.enum(['publish', 'rollback', 'unpublish']), at: z.string() })),
});
export type WebsiteLifecycle = z.infer<typeof WebsiteLifecycleSchema>;
export type WebsitePageDocument = z.infer<typeof WebsitePageDocumentSchema>;
export type WebsiteActor = z.infer<typeof WebsiteActorSchema>;
