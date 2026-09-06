import { describe, expect, it } from 'vitest';
import { TEMPLATE_VAULT } from '@/lib/template-vault';

describe('template vault', () => {
  it('keeps the existing Founder OS starters', () => {
    expect(TEMPLATE_VAULT.some((template) => template.id === 'editorial-studio')).toBe(true);
    expect(TEMPLATE_VAULT.some((template) => template.id === 'agency-ops')).toBe(true);
  });

  it('exposes all 20 FreeTemplateGo templates with auditable preview and source links', () => {
    const external = TEMPLATE_VAULT.filter((template) => template.id.startsWith('freetemplatego-'));
    expect(external).toHaveLength(20);
    expect(external.every((template) => template.previewUrl?.startsWith('https://demo.freetemplatego.com/'))).toBe(true);
    expect(external.every((template) => template.sourceUrl?.includes('github.com/making530/freetemplatego-templates'))).toBe(true);
    expect(external.every((template) => template.license?.includes('keep footer credit'))).toBe(true);
  });
});
