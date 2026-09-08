import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb } from '@/lib/db';
import { changeRelease, saveRevision, safeFile, snapshotSource, previewHtml, hash } from '@/lib/website-revisions';

describe('one-page website revisions', () => {
  it('snapshots complete assets, resolves directory indexes and rejects escapes', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'website-revisions-'));
    try {
      const root = path.join(temp, 'original');
      await fs.mkdir(path.join(root, 'about'), { recursive: true });
      await fs.writeFile(path.join(root, 'about/index.html'), '<html><body>Original</body></html>');
      const snapshot = path.join(temp, 'snapshot');
      const hashes = await snapshotSource(root, snapshot);
      expect(hashes['about/index.html']).toBe(hash('<html><body>Original</body></html>'));
      expect(await safeFile(snapshot, 'about/')).toBe(await fs.realpath(path.join(snapshot, 'about/index.html')));
      expect((await fs.stat(path.join(snapshot, 'about/index.html'))).mode & 0o222).toBe(0);
      await expect(safeFile(snapshot, '../original/about/index.html')).rejects.toThrow();
      await fs.symlink(path.join(root, 'about/index.html'), path.join(snapshot, 'escape.html'));
      await expect(safeFile(snapshot, 'escape.html')).rejects.toThrow();
    } finally { await fs.rm(temp, { recursive: true, force: true }); }
  });
  it('keeps nested and root-relative assets inside an exact revision', () => {
    const html = previewHtml('<html><head><base href="https://wrong.test/"></head><body><img src="/assets/a.jpg"><img src="../b.jpg"><img srcset="/a.jpg 1x, /b.jpg 2x"></body></html>', 'about/index.html', '/revision/one');
    expect(html).toContain('<base href="/revision/one/about/">');
    expect(html).toContain('src="/revision/one/assets/a.jpg"');
    expect(html).toContain('srcset="/revision/one/a.jpg 1x, /revision/one/b.jpg 2x"');
    expect(html).not.toContain('wrong.test');
  });
  it('requires explicit canonical selection and rejects concurrent state writes', () => {
    const db = openDb(':memory:');
    expect(db.websiteLifecycle.get()).toBeNull();
    db.websiteLifecycle.put({ projectId: 'chosen', pagePath: 'index.html', revisions: [], runs: [], releases: [] }, 0);
    expect(() => db.websiteLifecycle.put({ projectId: 'duplicate', pagePath: 'index.html', revisions: [], runs: [], releases: [] }, 0)).toThrow(/changed/);
    expect(db.websiteLifecycle.get()?.projectId).toBe('chosen');
    db.close();
  });
  it('binds approval, staging, publishing and rollback to immutable revisions', () => {
    let state: any = { projectId: 'chosen', pagePath: 'index.html', revisions: [], runs: [], releases: [] };
    state = saveRevision(state, '<html><head></head><body>Original</body></html>', 'source');
    const original = state.revisions[0];
    state = saveRevision(state, '<html><head></head><body>Revised</body></html>', 'agent');
    const revised = state.revisions[1];
    expect(original.html).toContain('Original');
    expect(() => changeRelease(state, 'publish', revised.id)).toThrow();
    state = changeRelease(state, 'approve', revised.id);
    state = changeRelease(state, 'stage', revised.id);
    state = changeRelease(state, 'publish', revised.id);
    expect(state.publishedId).toBe(revised.id);
    expect(() => changeRelease(state, 'rollback', original.id)).toThrow();
    state = changeRelease(state, 'approve', original.id);
    state = changeRelease(state, 'stage', original.id);
    state = changeRelease(state, 'publish', original.id);
    state = changeRelease(state, 'rollback', revised.id);
    expect(state.publishedId).toBe(revised.id);
  });
});
