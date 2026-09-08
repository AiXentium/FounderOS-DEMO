import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { hash, previewHtml, safeFile } from '@/lib/website-revisions';

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
type ReleaseMode = 'preview' | 'staging' | 'site';

export async function serveRelease(mode: ReleaseMode, parts: string[] = []) {
  try {
    const state = getDb().websiteLifecycle.get();
    if (!state?.sourceRoot) throw new Error(`${mode} revision is unavailable.`);
    const prefix = `/${mode}`;
    const requested = parts.length ? parts.join('/') : state.pagePath;
    const file = await safeFile(state.sourceRoot, requested);
    const relative = path.relative(await fs.realpath(state.sourceRoot), file).replaceAll('\\', '/');
    const id = mode === 'preview' ? (relative === state.pagePath ? state.selectedId : undefined) : mode === 'staging' ? state.stagedPages[relative] : state.publishedPages[relative];
    const revision = state.revisions.find(item => item.id === id);
    if (mode === 'preview' && relative === state.pagePath && !revision) throw new Error('Selected preview revision is unavailable.');
    if (mode === 'staging' && revision && revision.stagedHash !== revision.hash) throw new Error('The staged revision failed its integrity check.');
    if (mode === 'site' && !state.releases.length) throw new Error('No published release is available.');
    const original = await fs.readFile(file);
    if (hash(original) !== state.sourceHashes[relative]) throw new Error('Original file integrity check failed.');
    const ext = path.extname(file).toLowerCase();
    if (!MIME[ext]) throw new Error('This file type cannot be displayed.');
    let data: string | Buffer = original;
    if (ext === '.html') data = previewHtml(revision?.html ?? original.toString('utf8'), relative, prefix);
    if (ext === '.css') data = original.toString('utf8').replace(/url\(\s*(['"]?)\/(?!\/)([^)'"\s]+)\1\s*\)/gi, (_, quote, value) => `url(${quote}${prefix}/${value}${quote})`);
    return new NextResponse(typeof data === 'string' ? data : new Uint8Array(data), { headers: { 'content-type': MIME[ext], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "sandbox allow-scripts; default-src 'self' https: data: blob:; style-src 'self' https: 'unsafe-inline'; script-src 'self' https: 'unsafe-inline'; connect-src 'none'; form-action 'none'; frame-src 'none'", ...(revision ? { 'x-website-revision': revision.id } : {}), 'x-website-release-mode': mode } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${mode} unavailable.` }, { status: 404 });
  }
}
