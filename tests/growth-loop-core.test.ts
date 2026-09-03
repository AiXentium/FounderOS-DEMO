import { describe, expect, it } from 'vitest';
import { RevenueSpine } from '@/lib/growth/revenue-spine';
import { judgeExperiment, type GrowthExperiment } from '@/lib/growth/experiment-engine';
import { LearningEngine } from '@/lib/growth/learning-engine';
import { recommendRevenueActions } from '@/lib/growth/revenue-optimizer';

describe('Revenue Growth Loop core', () => {
  it('traces a creative through to revenue and contribution margin', () => {
    const spine = new RevenueSpine();
    const now = new Date().toISOString();
    spine.upsert({ id: 'cr-1', type: 'creative', businessId: 'b1', label: 'UGC A', createdAt: now });
    spine.upsert({ id: 'lead-1', type: 'lead', businessId: 'b1', label: 'Lead', createdAt: now });
    spine.upsert({ id: 'pay-1', type: 'payment', businessId: 'b1', label: 'Payment', createdAt: now, metadata: { amountUsd: 8500 } });
    spine.upsert({ id: 'margin-1', type: 'margin', businessId: 'b1', label: 'Contribution', createdAt: now, metadata: { amountUsd: 3200 } });
    spine.connect({ fromId: 'cr-1', toId: 'lead-1', relationship: 'generated', at: now });
    spine.connect({ fromId: 'lead-1', toId: 'pay-1', relationship: 'converted', at: now });
    spine.connect({ fromId: 'pay-1', toId: 'margin-1', relationship: 'produced', at: now });
    expect(spine.traceRevenueFrom('cr-1').map((entity) => entity.id)).toEqual(['pay-1', 'margin-1']);
  });

  it('does not declare a winner before evidence thresholds are reached', () => {
    const experiment: GrowthExperiment = {
      id: 'exp-1', businessId: 'b1', hypothesis: 'A beats B', primaryMetric: 'qualifiedLeadCac', guardrailMetrics: [], status: 'running',
      variants: [{ id: 'a', label: 'A', description: 'A' }, { id: 'b', label: 'B', description: 'B' }],
      minimumEvidence: { minQualifiedLeads: 5 },
    };
    expect(judgeExperiment(experiment, [
      { variantId: 'a', qualifiedLeads: 2, spendUsd: 100 },
      { variantId: 'b', qualifiedLeads: 2, spendUsd: 120 },
    ]).verdict).toBe('insufficient-evidence');
  });

  it('promotes only evidence-backed lessons to verified memory', () => {
    const engine = new LearningEngine();
    engine.propose({ id: 'lesson-1', businessId: 'b1', statement: 'Testimonial hooks outperform generic hooks.', confidence: 'medium', status: 'candidate', tags: ['creative'], createdAt: new Date().toISOString(), evidence: [{ sourceType: 'experiment', sourceId: 'exp-1' }] });
    expect(engine.verify('lesson-1').status).toBe('verified');
  });

  it('optimizes for contribution profit, not surface engagement', () => {
    const actions = recommendRevenueActions([{ id: 'meta', label: 'Meta', spendUsd: 1000, revenueUsd: 4000, contributionProfitUsd: 2200, qualifiedLeads: 20, opportunities: 8, sales: 3, creativeFatigue: 0.2, capacityConstraint: 0.2 }]);
    expect(actions.some((action) => action.type === 'scale')).toBe(true);
  });
});
