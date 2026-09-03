import { describe, expect, it } from 'vitest';
import { SUPER_AGENT_DEFINITIONS, getSuperAgentDefinition } from '@/lib/super-agents/definitions';

describe('portable Super Agent definitions', () => {
  it('has unique ids and roles for the initial portable workforce', () => {
    const ids = SUPER_AGENT_DEFINITIONS.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);

    const required = [
      'sa-tbrain',
      'sa-chief-of-staff',
      'sa-ceo',
      'sa-cfo',
      'sa-cmo',
      'sa-cro',
      'sa-coo',
      'sa-cto',
      'sa-customer-success',
      'website-super-agent',
      'creative-director-super-agent',
      'ugc-studio-super-agent',
    ];

    for (const id of required) expect(getSuperAgentDefinition(id)).toBeDefined();
  });

  it('requires evidence for completion across every Super Agent', () => {
    for (const agent of SUPER_AGENT_DEFINITIONS) {
      expect(agent.executionPolicy.requireEvidenceForCompletion).toBe(true);
      expect(agent.evaluationPolicy.evidenceRequirements.length).toBeGreaterThan(0);
    }
  });

  it('never gives a Super Agent permission to bypass human approval', () => {
    for (const agent of SUPER_AGENT_DEFINITIONS) {
      const prohibited = agent.prohibitedActions.join(' ').toLowerCase();
      expect(prohibited).not.toContain('bypass approval allowed');

      for (const rule of agent.approvalRules) {
        if (rule.risk === 'red') expect(rule.requiresHumanApproval).toBe(true);
      }
    }
  });

  it('keeps high-impact website and UGC publishing approval-gated', () => {
    const website = getSuperAgentDefinition('website-super-agent')!;
    const ugc = getSuperAgentDefinition('ugc-studio-super-agent')!;

    expect(website.approvalRules.some((rule) => rule.action.includes('publish') && rule.requiresHumanApproval)).toBe(true);
    expect(ugc.approvalRules.some((rule) => rule.action.includes('publish') && rule.requiresHumanApproval)).toBe(true);
  });

  it('uses provider-neutral routing instead of binding agents to a single model', () => {
    for (const agent of SUPER_AGENT_DEFINITIONS) {
      expect(agent.modelPolicy.mode).toBe('router');
      expect(agent.modelPolicy.avoid).toContain('single-provider-lock-in');
    }
  });
});
