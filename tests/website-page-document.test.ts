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

  it('preserves imported markup while applying governed copy, CTA, image and SEO changes', () => {
    const original = '<!doctype html><html><head><title>Original</title><meta name="description" content="Old"></head><body><main class="real-layout"><h1>Untouched source</h1><img src="images/old.jpg" alt="Old"><a class="button" href="/old">Book now</a></main></body></html>';
    let current = saveRevision({ projectId: 'p', pagePath: 'index.html', version: 0, sourceHashes: {}, stagedPages: {}, publishedPages: {}, schedules: [], revisions: [], runs: [], releases: [] }, original, 'source');
    current = applyManagedCommand(current, { action: 'editSourceText', actor, match: 'Untouched source', replacement: 'Updated by the editor' });
    current = applyManagedCommand(current, { action: 'editSourceCta', actor, match: 'Book now', replacement: 'See availability', href: '/new' });
    current = applyManagedCommand(current, { action: 'swapSourceImage', actor, sourceUrl: 'images/old.jpg', replacementUrl: 'images/new.jpg', alt: 'Madrid skyline' });
    current = applyManagedCommand(current, { action: 'updateSeo', actor, seo: { title: 'New title', description: 'New description', noIndex: false } });
    const html = current.revisions.at(-1)!.html;
    expect(html).toContain('class="real-layout"');
    expect(html).toContain('Updated by the editor');
    expect(html).toContain('href="/new"');
    expect(html).toContain('src="images/new.jpg"');
    expect(html).toContain('alt="Madrid skyline"');
    expect(html).toContain('<title>New title</title>');
    expect(current.revisions[0].html).toBe(original);
  });

  it('adds an affiliate offer and disclosure through a controlled section', () => {
    const next = applyManagedCommand(state(), { action: 'addAffiliate', actor, offer: { id: 'a1', provider: 'amazon', title: 'Travel adapter', destination: 'Travel', sourceUrl: 'https://www.amazon.com/dp/example', trackedUrl: 'https://amzn.to/example', matchReason: 'Manually selected for this packing guide.', status: 'proposed', verifiedAt: actor.at } });
    expect(next.revisions.at(-1)?.document?.sections.some(section => section.type === 'affiliate')).toBe(true);
    expect(next.revisions.at(-1)?.html).toContain('This page contains affiliate links');
    expect(next.revisions.at(-1)?.html).toContain('rel="sponsored nofollow noopener"');
  });
});
