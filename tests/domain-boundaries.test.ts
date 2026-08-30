import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('canonical domain boundaries', () => {
  it('documents every frozen v2 domain exactly once', () => {
    const document = fs.readFileSync('docs/DOMAIN_BOUNDARIES.md', 'utf8');
    const domains = ['Platform', 'Workspace', 'AI Runtime', 'Memory / Knowledge', 'CRM', 'Finance', 'Communications', 'Marketing', 'Analytics', 'Connectors', 'Deployment'];
    for (const domain of domains) expect(document).toContain(`| ${domain} |`);
  });

  it('keeps the boundary contract rules explicit', () => {
    const document = fs.readFileSync('docs/DOMAIN_BOUNDARIES.md', 'utf8');
    expect(document).toContain('UI components call public APIs');
    expect(document).toContain('domains must not import UI components');
  });
});
