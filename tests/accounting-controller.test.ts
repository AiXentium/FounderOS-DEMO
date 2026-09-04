import { afterEach, describe, expect, test } from 'vitest';
import { openDb, type FounderDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { accountingBusinessProfile, accountingReadiness, syncAccountingControllerActivation } from '@/lib/accounting-controller';

let db: FounderDb;

afterEach(() => db?.close());

describe('Accounting Controller activation', () => {
  test('stays reusable but planned without a configured business profile', () => {
    db = openDb(':memory:');
    seedDatabase(db);
    const readiness = syncAccountingControllerActivation(db);
    expect(readiness.active).toBe(false);
    expect(db.agents.all().find((agent) => agent.id === 'accounting-controller')?.status).toBe('planned');
  });

  test('activates for a travel-agency setup and exposes travel capabilities', () => {
    db = openDb(':memory:');
    seedDatabase(db);
    const now = new Date().toISOString();
    db.websiteProjects.save({
      id: 'travel-setup',
      name: 'Lets Talk Miles and Travel',
      prompt: 'Travel agency. affiliate and marketing strategy. Barcelona travel guides',
      direction: 'editorial',
      page: { businessType: 'travel agency', projectMode: 'affiliate and marketing', domain: 'letstalkmilesandtravel.com' },
      createdAt: now,
      updatedAt: now,
    });
    const profile = accountingBusinessProfile(db);
    const readiness = syncAccountingControllerActivation(db);
    expect(profile.sector).toBe('travel-agency');
    expect(readiness.active).toBe(true);
    expect(readiness.profile.capabilities.some((capability) => /affiliate commission/i.test(capability))).toBe(true);
    expect(db.agents.all().find((agent) => agent.id === 'accounting-controller')?.status).toBe('active');
  });

  test('does not claim tax readiness without jurisdiction and entity inputs', () => {
    db = openDb(':memory:');
    seedDatabase(db);
    const now = new Date().toISOString();
    db.websiteProjects.save({
      id: 'travel-setup',
      name: 'Travel agency',
      prompt: 'travel agency',
      direction: 'editorial',
      page: { businessType: 'travel agency', projectMode: 'affiliate' },
      createdAt: now,
      updatedAt: now,
    });
    expect(accountingReadiness(db).tax.state).toBe('needs_profile');
  });
});
