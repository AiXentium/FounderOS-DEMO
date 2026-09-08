import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { applyManagedCommand, initialDocument, renderDocument } from '@/lib/website-page-document';
import { WebsiteActorSchema, WebsitePageDocumentSchema } from '@/lib/website-revision-schema';
import { hash } from '@/lib/website-revisions';

export const dynamic = 'force-dynamic';
const Schema = z.object({
  projectId: z.string().min(1), version: z.number().int().nonnegative(),
  action: z.enum(['createPage', 'changeTemplate', 'addSection', 'removeSection', 'reorderSection', 'editSection', 'updateSeo', 'addAffiliate', 'attachCatalogAffiliate', 'schedule', 'cancelSchedule', 'unpublish']),
  actor: WebsiteActorSchema.omit({ at: true }).extend({ at: z.string().optional() }),
  pagePath: z.string().optional(), revisionId: z.string().optional(), templateId: z.string().optional(), section: z.unknown().optional(), sectionId: z.string().optional(), index: z.number().int().optional(), patch: z.record(z.unknown()).optional(), seo: z.unknown().optional(), offer: z.unknown().optional(), catalogProductId: z.string().optional(), matchReason: z.string().max(1000).optional(), scheduledFor: z.string().optional(), scheduleAction: z.enum(['publish', 'unpublish']).optional(), scheduleId: z.string().optional(), title: z.string().optional(), pageType: z.enum(['standard', 'article', 'destination', 'campaign']).optional(),
});
const validPath = (value: string) => !value.includes('..') && !value.includes('\\') && !value.startsWith('/') && value.endsWith('.html');

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data; const db = getDb(); const current = db.websiteLifecycle.get();
  try {
    if (!current || current.projectId !== body.projectId) throw new Error('Load the canonical website project first.');
    if (current.version !== body.version) throw new Error('Website state changed. Reload before trying again.');
    const actor = WebsiteActorSchema.parse({ ...body.actor, at: body.actor.at || new Date().toISOString() });
    let next = current;
    if (body.action === 'createPage') {
      if (!body.pagePath || !validPath(body.pagePath) || current.revisions.some(r => r.pagePath === body.pagePath)) throw new Error('Choose a new safe .html page path.');
      const base = current.revisions.find(r => r.id === current.selectedId); if (!base) throw new Error('Select a revision first.');
      let document = initialDocument('<html><head></head><body></body></html>', body.pagePath);
      document = WebsitePageDocumentSchema.parse({ ...document, title: body.title || 'New page', pageType: body.pageType || 'standard', seo: { ...document.seo, title: body.title || 'New page' } });
      const html = renderDocument(document); const revision = { ...base, id: randomUUID(), pagePath: body.pagePath, html, hash: hash(html), kind: 'manual' as const, createdAt: new Date().toISOString(), parentId: undefined, approvedHash: undefined, approvedAt: undefined, stagedHash: undefined, document, attribution: actor, affiliateOffers: [], status: 'draft' as const, qa: { status: 'not_run' as const, summary: 'QA must run before approval.', checks: [] } };
      next = { ...current, pagePath: body.pagePath, selectedId: revision.id, revisions: [...current.revisions, revision] };
    } else if (body.action === 'attachCatalogAffiliate') {
      const product: any = db.affiliateProducts.all().find((item: any) => item.id === body.catalogProductId);
      if (!product || product.status !== 'approved') throw new Error('Only an approved affiliate catalog product can be attached.');
      const trackedUrl = String(product.trackedUrl || ''); const sourceUrl = String(product.url || '');
      const amazon = (value: string) => { try { const host = new URL(value).hostname; return host === 'amzn.to' || host.endsWith('.amazon.com') || /(^|\.)amazon\.[a-z.]+$/i.test(host); } catch { return false; } };
      if (!amazon(sourceUrl) || !amazon(trackedUrl)) throw new Error('Manual catalog attachment currently supports verified Amazon links only.');
      const parent = current.revisions.find(item => item.id === (body.revisionId || current.selectedId)); if (!parent) throw new Error('Select a revision first.');
      const title = String(product.name || 'Amazon travel product'); const destination = parent.document?.title || 'Travel';
      next = applyManagedCommand(current, { action: 'addAffiliate', actor, revisionId: parent.id, offer: { id: String(product.id), provider: 'amazon', title, destination, sourceUrl, trackedUrl, matchReason: body.matchReason || `Manually selected for ${destination}; relevance requires page approval.`, status: 'proposed', verifiedAt: new Date().toISOString() } });
    } else if (body.action === 'schedule') {
      if (!body.scheduledFor || !body.scheduleAction || Number.isNaN(Date.parse(body.scheduledFor))) throw new Error('A valid scheduled time and action are required.');
      if (body.scheduleAction === 'publish') {
        const revision = current.revisions.find(r => r.id === body.revisionId); if (!revision?.approvedHash || !revision.stagedHash) throw new Error('Only an approved staged revision can be scheduled for publishing.');
      }
      next = { ...current, schedules: [...current.schedules, { id: randomUUID(), pagePath: body.pagePath || current.pagePath, revisionId: body.revisionId, action: body.scheduleAction, scheduledFor: body.scheduledFor, status: 'scheduled' as const, attribution: actor }] };
    } else if (body.action === 'cancelSchedule') {
      next = { ...current, schedules: current.schedules.map(s => s.id === body.scheduleId && s.status === 'scheduled' ? { ...s, status: 'cancelled' as const } : s) };
    } else if (body.action === 'unpublish') {
      const pagePath = body.pagePath || current.pagePath; const publishedPages = { ...current.publishedPages }; const revisionId = publishedPages[pagePath]; delete publishedPages[pagePath];
      next = { ...current, publishedPages, releases: [...current.releases, { revisionId: revisionId || 'unpublished', pageRevisions: publishedPages, build: process.env.RAILWAY_GIT_COMMIT_SHA || 'local', url: '/site', action: 'unpublish' as const, at: new Date().toISOString() }] };
    } else next = applyManagedCommand(current, { ...body, actor });
    return NextResponse.json({ state: db.websiteLifecycle.put(next, current.version) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Structured website action failed.' }, { status: 409 }); }
}
