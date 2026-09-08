import { after, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { changeRelease, safeFile, saveRevision, snapshotSource } from '@/lib/website-revisions';
import { runWebsitePage } from '@/lib/website-page-worker';
import { websiteDataRoot } from '@/lib/website-storage';
import type { WebsiteLifecycle } from '@/lib/website-revision-schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const RequestSchema = z.object({ action: z.enum(['canonical', 'run', 'runAll', 'selectPage', 'save', 'select', 'approve', 'reject', 'stage', 'publish', 'rollback']), projectId: z.string().min(1), pagePath: z.string().optional(), version: z.number().int().nonnegative(), revisionId: z.string().optional(), request: z.string().min(1).max(12000).optional(), html: z.string().max(2_000_000).optional() });

export async function GET() {
  const db = getDb();
  let state = db.websiteLifecycle.get();
  if (state?.runs.some(run => run.status === 'running' && Date.now() - Date.parse(run.startedAt) > 600000)) {
    state = db.websiteLifecycle.put({ ...state, runs: state.runs.map(run => {
      if (run.status !== 'running' || Date.now() - Date.parse(run.startedAt) <= 600000) return run;
      db.localJobs.update(run.id, 'failed', 'Website worker interrupted or timed out. Retry the page request.');
      return { ...run, status: 'failed', error: 'Worker interrupted or timed out. Saved results are retained.', finishedAt: new Date().toISOString() };
    }) }, state.version);
  }
  if (!state?.runs.some(run => run.status === 'running')) {
    const job = db.localJobs.all().find(item => item.type === 'website-page-revision' && item.status === 'queued');
    if (job) after(() => runWebsitePage(db, job.id));
  }
  return NextResponse.json({ state, build: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.BUILDER_BUILD_SHA || 'local' }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const db = getDb();
  let state = db.websiteLifecycle.get();
  try {
    if ((state?.version ?? 0) !== body.version) throw new Error('Website state changed. Reload before trying again.');
    if (body.action === 'canonical') {
      if (state) throw new Error('The canonical pilot is already selected. Finish this page before changing projects.');
      const project = db.websiteProjects.all().find(item => item.id === body.projectId);
      const page = project?.page?.pages?.find((item: any) => path.relative(project.page.packageRoot, item.file).replaceAll('\\', '/') === body.pagePath);
      if (!project?.page?.packageRoot || !page) throw new Error('Select an imported project and one of its HTML pages.');
      const source = await safeFile(project.page.packageRoot, body.pagePath!);
      const root = path.join(websiteDataRoot(), 'website-sources', randomUUID());
      const hashes = await snapshotSource(project.page.packageRoot, root);
      const initial = saveRevision({ projectId: project.id, pagePath: body.pagePath!, version: 0, sourceRoot: root, sourceHashes: hashes, stagedPages: {}, publishedPages: {}, revisions: [], runs: [], releases: [] }, await fs.readFile(path.join(root, body.pagePath!), 'utf8'), 'source');
      state = db.websiteLifecycle.put(initial, 0);
    } else {
      if (!state || state.projectId !== body.projectId) throw new Error('Load the canonical project first.');
      if (state.runs.some(item => item.status === 'running')) throw new Error('The page worker is running.');
      if (body.action === 'selectPage') {
        if (!body.pagePath || !state.sourceHashes[body.pagePath] || !body.pagePath.endsWith('.html')) throw new Error('Select an imported HTML page.');
        const oldPath = state.pagePath;
        const revisions = state.revisions.map(item => item.pagePath ? item : { ...item, pagePath: oldPath });
        const selected = [...revisions].reverse().find(item => item.pagePath === body.pagePath);
        let next: WebsiteLifecycle = { ...state, revisions, pagePath: body.pagePath, selectedId: selected?.id };
        if (!selected) {
          const file = await safeFile(state.sourceRoot!, body.pagePath);
          next = saveRevision(next, await fs.readFile(file, 'utf8'), 'source');
        }
        state = db.websiteLifecycle.put(next, state.version);
      } else if (body.action === 'runAll') {
        const project = db.websiteProjects.all().find(item => item.id === state!.projectId);
        const pages = (project?.page?.pages ?? []).map((item: any) => path.relative(project.page.packageRoot, item.file).replaceAll('\\', '/')).filter((item: string) => item.endsWith('.html'));
        if (!pages.length) throw new Error('No imported HTML pages were found.');
        if (db.localJobs.all().some(item => item.type === 'website-page-revision' && ['queued', 'running'].includes(item.status))) throw new Error('Website page work is already queued or running.');
        const now = new Date().toISOString();
        for (const pagePath of pages) db.localJobs.enqueue({ id: randomUUID(), type: 'website-page-revision', createdAt: now, payload: { projectId: state.projectId, pagePath, request: body.request || 'Preserve all factual content and links. Improve this page with approved existing design patterns, relevant source images, SEO, destination-matched affiliate proposals, internal-link validation, and mobile QA. Never invent facts, prices, reviews, images, or experiences.' } });
        return NextResponse.json({ queued: pages.length, state }, { status: 202 });
      } else if (body.action === 'run') {
        if (!body.request || !body.revisionId || !state.revisions.some(item => item.id === body.revisionId)) throw new Error('Select a revision and describe the page changes.');
        if (db.localJobs.all().some(item => item.type === 'website-page-revision' && ['queued', 'running'].includes(item.status))) throw new Error('A website page job is already queued or running.');
        const id = randomUUID();
        db.localJobs.enqueue({ id, type: 'website-page-revision', createdAt: new Date().toISOString(), payload: { projectId: state.projectId, pagePath: state.pagePath, revisionId: body.revisionId, request: body.request } });
        after(() => runWebsitePage(db, id));
        return NextResponse.json({ jobId: id, state }, { status: 202 });
      }
      if (body.action === 'selectPage') {
        // The page switch was persisted above; it is not a release action.
      } else if (body.action === 'save') {
        if (!body.html) throw new Error('HTML is required.');
        state = db.websiteLifecycle.put(saveRevision(state, body.html, 'manual'), state.version);
      } else {
        if (!body.revisionId) throw new Error('Select an exact revision.');
        state = db.websiteLifecycle.put(changeRelease(state, body.action, body.revisionId), state.version);
      }
    }
    const url = body.action === 'stage' ? '/staging' : ['publish', 'rollback'].includes(body.action) ? '/site' : body.action === 'select' ? '/preview' : undefined;
    return NextResponse.json({ state, ...(url ? { url } : {}) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Website action failed.' }, { status: 409 }); }
}
