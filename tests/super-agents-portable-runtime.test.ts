import { describe, expect, it } from 'vitest';
import { createPortableCapabilityRegistry } from '@/lib/super-agents/capability-registry';
import { composeTeam } from '@/lib/super-agents/team-composer';
import { createMissionPlan, readySteps } from '@/lib/super-agents/mission-planner';
import { createGoldenMarketingMission } from '@/lib/super-agents/golden-marketing-mission';

describe('portable Super Agent runtime', () => {
  it('resolves known capabilities and reports unknown ones honestly', () => {
    const registry = createPortableCapabilityRegistry();
    const result = registry.resolve(['knowledge.retrieval', 'does.not.exist']);
    expect(result.resolved.map((item) => item.id)).toContain('knowledge.retrieval');
    expect(result.missing).toEqual(['does.not.exist']);
  });

  it('composes a cross-functional marketing team without duplicating capabilities', () => {
    const registry = createPortableCapabilityRegistry();
    const team = composeTeam(registry, {
      objective: 'Launch a measured campaign',
      preferredLeadRole: 'cmo',
      requiredCapabilities: ['marketing.hook-writing', 'marketing.ugc-generation', 'website.seo-brief'],
    });
    expect(team.lead.role).toBe('cmo');
    expect(team.ready).toBe(true);
    expect(new Set(team.members.map((member) => member.role)).size).toBe(team.members.length);
  });

  it('puts yellow/red missions behind approval', () => {
    const mission = createMissionPlan({
      businessId: 'demo',
      objective: 'Publish approved campaign',
      ownerRole: 'cmo',
      steps: [{ title: 'Publish', ownerRole: 'cmo', requiredCapabilities: ['marketing.cross-post'], risk: 'yellow' }],
    });
    expect(mission.status).toBe('awaiting-approval');
  });

  it('only exposes steps whose dependencies are complete', () => {
    const mission = createMissionPlan({
      businessId: 'demo',
      objective: 'Sequential test',
      ownerRole: 'tbrain',
      steps: [
        { title: 'Research', ownerRole: 'tbrain', requiredCapabilities: ['knowledge.retrieval'] },
        { title: 'Plan', ownerRole: 'ceo', requiredCapabilities: ['planning.goal-decomposition'], dependsOn: ['1'] },
      ],
    });
    expect(readySteps(mission, []).map((step) => step.id)).toEqual(['step-1']);
    expect(readySteps(mission, ['step-1']).map((step) => step.id)).toEqual(['step-2']);
  });

  it('golden marketing mission connects context, CMO, creative, UGC, website, CRO and judge', () => {
    const mission = createGoldenMarketingMission('demo-business', 'Launch a campaign for the new service');
    expect(mission.ownerRole).toBe('cmo');
    expect(mission.status).toBe('awaiting-approval');
    expect(new Set(mission.steps.map((step) => step.ownerRole))).toEqual(
      new Set(['tbrain', 'cmo', 'creative-director', 'ugc-studio', 'website', 'cro']),
    );
    expect(mission.steps.some((step) => step.requiredCapabilities.includes('website.visual-qa'))).toBe(true);
    expect(mission.steps.some((step) => step.requiredCapabilities.includes('analytics.revenue-attribution'))).toBe(true);
  });
});
