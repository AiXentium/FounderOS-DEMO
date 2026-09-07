import { describe, expect, test } from 'vitest';
import { openDb } from '@/lib/db';
import { buildInitialBrandBlueprint } from '@/lib/brand-vault';

describe('business brand vault', () => {
  test('persists an isolated brand blueprint for a workspace', () => {
    const db = openDb(':memory:');
    const now = new Date().toISOString();
    const blueprint = buildInitialBrandBlueprint({ businessName: 'North Star Travel', businessType: 'travel affiliate business', audience: 'Frequent travelers', offer: 'Points and miles guides' });
    db.brandVault.save({ id: 'brand-test', workspaceId: 'default', businessName: blueprint.businessName, businessType: blueprint.businessType, status: 'draft', blueprint, createdAt: now, updatedAt: now });
    const saved = db.brandVault.get('default');
    expect(saved?.businessName).toBe('North Star Travel');
    expect(saved?.blueprint.frontendTemplateId).toBe('editorial-studio');
    expect(db.brandVault.get('other-workspace')).toBeNull();
    db.close();
  });
});
