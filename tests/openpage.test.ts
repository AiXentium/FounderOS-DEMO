import { describe, expect, test } from 'vitest';
import { defaultOpenPageDocument, normalizeOpenPageDocument, openPageSlug, renderOpenPageHtml } from '@/lib/openpage';

describe('OpenPage workspace', () => {
  test('starter is a structured document with a useful page flow', () => {
    const document = defaultOpenPageDocument('Barcelona test');
    expect(document.schemaVersion).toBe('openpage-v1');
    expect(document.blocks.map((block) => block.type)).toEqual(['navbar', 'hero', 'features', 'content', 'stats', 'cta', 'footer']);
  });

  test('normalization bounds unknown blocks and keeps the OpenPage schema', () => {
    const document = normalizeOpenPageDocument({ name: 'Draft', blocks: [{ id: 'one', type: 'unknown', label: 'Unsafe', props: {} }] });
    expect(document.schemaVersion).toBe('openpage-v1');
    expect(document.blocks[0].type).toBe('content');
  });

  test('HTML export escapes authored copy', () => {
    const document = normalizeOpenPageDocument({ name: 'X', blocks: [{ id: 'hero', type: 'hero', label: 'Hero', props: { headline: '<script>alert(1)</script>' } }] });
    const html = renderOpenPageHtml(document);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  test('memory slugs stay in the OpenPage namespace', () => {
    expect(openPageSlug('Barcelona Affiliate Draft', '12345678-foo')).toBe('openpage/barcelona-affiliate-draft-12345678');
  });
});
