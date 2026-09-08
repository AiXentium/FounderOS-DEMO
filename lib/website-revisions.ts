import { randomUUID, createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { WebsiteLifecycle } from '@/lib/website-revision-schema';

export const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

export function decodeHtmlEdits(output: string) {
  return z.object({ edits: z.array(z.object({ before: z.string().min(1).max(8000), after: z.string().min(1).max(8000) })).min(1).max(10) }).parse(JSON.parse(output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))).edits;
}
export function applyHtmlEdits(original: string, output: string) {
  const edits = decodeHtmlEdits(output);
  let html = original;
  for (const edit of edits) {
    if (html.split(edit.before).length !== 2) throw new Error('An agent edit did not uniquely match the saved HTML. Source preserved.');
    html = html.replace(edit.before, () => edit.after);
  }
  const resources = (text: string) => [...text.matchAll(/\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/gi)].map(match => match[1]);
  const before = resources(original), after = resources(html);
  if (before.some(url => !after.includes(url)) || after.some(url => !before.includes(url))) throw new Error('Pilot edits must preserve existing image and link URLs. Review content evidence before adding new resources.');
  if (html === original) throw new Error('Agents returned no page changes.');
  return html;
}

export function saveRevision(state: WebsiteLifecycle, html: string, kind: 'source' | 'agent' | 'manual'): WebsiteLifecycle {
  if (!/<html[\s>]/i.test(html) || !/<\/html\s*>/i.test(html) || !/<body[\s>]/i.test(html) || html.length > 2_000_000) throw new Error('A complete HTML document is required.');
  const revision = { id: randomUUID(), html, hash: hash(html), kind, createdAt: new Date().toISOString(), parentId: state.selectedId, appliedEdits: [], contentChanges: [], designChanges: [], mediaChanges: [], seo: [], affiliateProposals: [], warnings: [], qa: { status: 'not_run' as const, summary: 'QA has not run.', checks: [] }, status: kind === 'source' ? 'source' as const : 'draft' as const };
  return { ...state, selectedId: revision.id, revisions: [...state.revisions, revision] };
}

export function changeRelease(state: WebsiteLifecycle, action: 'approve' | 'stage' | 'publish' | 'rollback' | 'select', id: string): WebsiteLifecycle {
  const revision = state.revisions.find(item => item.id === id);
  if (!revision || hash(revision.html) !== revision.hash) throw new Error('Revision missing or integrity check failed.');
  if (state.runs.some(run => run.status === 'running')) throw new Error('Wait for the current page run to finish.');
  if (action === 'select') return { ...state, selectedId: id };
  if (action === 'approve' && revision.qa.status === 'failed') throw new Error('Resolve failed QA before approval.');
  if (action === 'approve') return { ...state, revisions: state.revisions.map(item => item.id === id ? { ...item, status: 'approved', approvedHash: item.hash, approvedAt: new Date().toISOString() } : item) };
  if (revision.approvedHash !== revision.hash) throw new Error('Approve this exact revision first.');
  if (action === 'stage') return { ...state, revisions: state.revisions.map(item => item.id === id ? { ...item, status: 'staged', stagedHash: item.hash } : item) };
  if (revision.stagedHash !== revision.hash) throw new Error('Stage this exact revision first.');
  if (action === 'rollback' && !state.releases.some(item => item.revisionId === id)) throw new Error('Rollback requires a previously published revision.');
  return { ...state, publishedId: id, revisions: state.revisions.map(item => item.id === id ? { ...item, status: 'published' } : item), releases: [...state.releases, { revisionId: id, action, at: new Date().toISOString() }] };
}

export async function safeFile(root: string, relative: string) {
  if (relative.includes('\\') || relative.split('/').includes('..') || path.isAbsolute(relative)) throw new Error('Invalid package path.');
  const realRoot = await fs.realpath(root);
  let file = path.resolve(realRoot, relative);
  if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
  const real = await fs.realpath(file);
  if (!real.startsWith(realRoot + path.sep)) throw new Error('File is outside the package.');
  return real;
}

export async function snapshotSource(root: string, destination: string) {
  const hashes: Record<string, string> = {};
  let bytes = 0;
  async function visit(dir: string, rel = '') {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const relative = path.posix.join(rel, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Source package contains a symbolic link.');
      if (entry.isDirectory()) { await visit(path.join(dir, entry.name), relative); continue; }
      if (!entry.isFile()) throw new Error('Unsupported source file.');
      const file = await safeFile(root, relative);
      const data = await fs.readFile(file);
      bytes += data.length;
      if (bytes > 500 * 1024 * 1024 || Object.keys(hashes).length >= 20000) throw new Error('Package exceeds source snapshot limits.');
      hashes[relative] = hash(data);
      const target = path.join(destination, relative);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data, { flag: 'wx', mode: 0o444 });
    }
  }
  await visit(root);
  return hashes;
}

// Each revision owns its URL prefix, so browser navigation and assets remain
// bound to that revision without cookies or a mutable global preview pointer.
export function previewHtml(html: string, pagePath: string, prefix: string) {
  const directory = path.posix.dirname(pagePath);
  const base = `${prefix}/${directory === '.' ? '' : directory + '/'}`;
  let result = html.replace(/<base\b[^>]*>/gi, '');
  result = result.replace(/\b(src|href|poster|action)=(['"])\/(?!\/)([^'"]*)\2/gi, (_, attr, quote, value) => `${attr}=${quote}${prefix}/${value}${quote}`);
  result = result.replace(/url\(\s*(['"]?)\/(?!\/)([^)'"\s]+)\1\s*\)/gi, (_, quote, value) => `url(${quote}${prefix}/${value}${quote})`);
  result = result.replace(/\bsrcset=(['"])(.*?)\1/gi, (_, quote, values) => `srcset=${quote}${values.replace(/(^|,\s*)\/(?!\/)/g, `$1${prefix}/`)}${quote}`);
  return result.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
}
