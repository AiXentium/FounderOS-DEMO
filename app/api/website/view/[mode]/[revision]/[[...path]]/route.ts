import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { hash, previewHtml, safeFile } from '@/lib/website-revisions';

export const dynamic = 'force-dynamic';
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

export async function GET(_request: Request, context: { params: Promise<{ mode: string; revision: string; path?: string[] }> }) {
  try {
    const { mode, revision: requestedId, path: parts = [] } = await context.params;
    const state = getDb().websiteLifecycle.get();
    const id = mode === 'live' && requestedId === 'current' ? state?.publishedId : requestedId;
    const revision = state?.revisions.find(item => item.id === id);
    if (!state) throw new Error('Website lifecycle is unavailable.');
    if (!state.sourceRoot) throw new Error('Protected source is unavailable.');
    if (!revision) throw new Error(`Revision ${id} is unavailable.`);
    if (!['preview', 'staging', 'live'].includes(mode)) throw new Error(`View mode ${mode} is unavailable.`);
    if (mode === 'staging' && revision.stagedHash !== revision.hash) throw new Error('This revision has not been staged.');
    if (mode === 'live' && !state.releases.some(item => item.revisionId === id)) throw new Error('This revision has not been published.');
    const prefix = `/api/website/view/${mode}/${id}`;
    const requested = parts.length ? parts.join('/') : revision.pagePath || state.pagePath;
    const file = await safeFile(state.sourceRoot, requested);
    const relative = path.relative(await fs.realpath(state.sourceRoot), file).replaceAll('\\', '/');
    const original = await fs.readFile(file);
    if (hash(original) !== state.sourceHashes[relative]) throw new Error('Original file integrity check failed.');
    const ext = path.extname(file).toLowerCase();
    if (!MIME[ext]) throw new Error('This file type cannot be displayed.');
    let data: string | Buffer = original;
    if (ext === '.html') data = previewHtml(relative === (revision.pagePath || state.pagePath) ? revision.html : original.toString('utf8'), relative, prefix);
    if (ext === '.css') data = original.toString('utf8').replace(/url\(\s*(['"]?)\/(?!\/)([^)'"\s]+)\1\s*\)/gi, (_, quote, value) => `url(${quote}${prefix}/${value}${quote})`);
    return new NextResponse(typeof data === 'string' ? data : new Uint8Array(data), { headers: { 'content-type': MIME[ext], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "sandbox allow-scripts; default-src 'self' https: data: blob:; style-src 'self' https: 'unsafe-inline'; script-src 'self' https: 'unsafe-inline'; connect-src 'none'; form-action 'none'; frame-src 'none'", 'x-website-revision': revision.id } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Preview unavailable.' }, { status: 404 }); }
}
