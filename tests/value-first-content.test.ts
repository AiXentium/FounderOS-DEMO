import { describe, expect, test } from 'vitest';
import { buildValueFirstPlan } from '@/lib/value-first-content';

describe('value-first content planner', () => {
  test('creates a complete content ladder from one source packet', () => {
    const plan = buildValueFirstPlan({
      topic: 'Barcelona food and points itinerary',
      audience: 'travelers planning a three-day trip',
      offer: 'the downloadable planning guide',
      evidence: 'Use official attraction sources and dated partner inventory.',
    });

    expect(plan.system).toBe('value-first-owned-audience');
    expect(plan.video.narration.length).toBeGreaterThanOrEqual(4);
    expect(plan.video.shotList.join(' ')).toMatch(/licensed|owned/i);
    expect(plan.repurposing.map((item) => item.channel)).toEqual(expect.arrayContaining(['YouTube', 'Newsletter', 'Blog', 'Pinterest']));
    expect(plan.bridge.emailSequence).toHaveLength(3);
    expect(plan.approvalGates.join(' ')).toMatch(/human/i);
  });

  test('uses readable fallbacks and does not claim to render or publish', () => {
    const plan = buildValueFirstPlan({ topic: '', audience: '', offer: '', evidence: '' });
    const serialized = JSON.stringify(plan);
    expect(plan.sourcePacket.topic).toBe('A useful travel decision');
    expect(serialized).not.toMatch(/published automatically|video rendered/i);
    expect(plan.productionRule).toMatch(/evidence|rights|approval/i);
  });
});
