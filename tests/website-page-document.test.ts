import { describe, expect, it } from 'vitest';
import { applyManagedCommand, initialDocument, renderDocument } from '@/lib/website-page-document';
import { saveRevision } from '@/lib/website-revisions';

const actor = { type: 'human' as const, id: 'owner', label: 'Site owner', at: '2026-01-01T00:00:00.000Z' };
function state() {
  return saveRevision({ projectId: 'p', pagePath: 'index.html', version: 0, sourceHashes: {}, stagedPages: {}, publishedPages: {}, schedules: [], revisions: [], runs: [], releases: [] }, '<html><head><title>Original</title></head><body>Untouched source</body></html>', 'source');
}

describe('structured website management', () => {
  it('renders only approved templates and fixed variants', () => {
    const doc = initialDocument('<html><head><title>Madrid</title></head><body></body></html>', 'madrid.html');
    doc.sections.push({ id: 'hero', type: 'hero', variant: 'centered', heading: 'Madrid', body: 'A real guide.', items: [], offerIds: [], visible: true });
    expect(renderDocument(doc)).toContain('variant-centered');
    expect(() => renderDocument({ ...doc, templateId: 'random-template' })).toThrow(/approved template/);
  });

  it('creates an attributed child revision and rejects CSS or HTML patches', () => {
    let next = applyManagedCommand(state(), { action: 'addSection', actor, section: { id: 'intro', type: 'rich-text', variant: 'standard', heading: 'Welcome', body: 'Preserved facts.', items: [], offerIds: [], visible: true } });
    expect(next.revisions).toHaveLength(2);
    expect(next.revisions[0].html).toContain('Untouched source');
    expect(next.revisions[1].attribution?.id).toBe('owner');
    expect(() => applyManagedCommand(next, { action: 'editSection', actor, sectionId: 'intro', patch: { css: 'body{display:none}' } })).toThrow(/CSS and HTML/);
  });
});
