import { describe, expect, test } from 'vitest';
import { buildCompliancePayload, canPublishReview, findRiskyClaims, reviewStatus, type ComplianceControls } from '@/lib/content-compliance';

const controls: ComplianceControls = {
  rightsCleared: true,
  claimsSubstantiated: true,
  disclosurePresent: true,
  disclosurePlacement: 'near_recommendation',
  platformReviewed: true,
  humanApproved: false,
};

const base = {
  platforms: ['youtube', 'tiktok'],
  affiliate: true,
  claims: [{ text: 'This route saves time for travelers who arrive early.', source: 'https://example.test/route-notes', checkedAt: '2026-09-06', confidence: 'medium' as const, reviewerApproved: true }],
  assets: [{ id: 'asset-1', assetName: 'barcelona.jpg', assetType: 'image', source: 'owned photo archive', rightsStatus: 'cleared' as const, license: 'owned', expiresAt: null, attribution: '', notes: '' }],
  originality: { originalResearch: true, newCommentary: true, distinctScript: true, meaningfulEditing: true, uniqueVisuals: true, educationalValue: true },
  controls,
};

describe('content compliance gate', () => {
  test('passes a substantiated, rights-cleared, disclosed draft only after human approval', () => {
    const pending = buildCompliancePayload(base);
    expect(pending.originality.score).toBe(100);
    expect(pending.checks.every((item) => item.status === 'pass')).toBe(true);
    expect(reviewStatus(pending)).toBe('ready_for_approval');
    const approved = buildCompliancePayload({ ...base, controls: { ...controls, humanApproved: true } });
    expect(reviewStatus(approved)).toBe('approved');
    expect(canPublishReview({ status: 'approved', payload: approved }, ['youtube'])).toEqual({ allowed: true });
  });

  test('blocks risky claims, missing rights, and missing disclosure', () => {
    expect(findRiskyClaims([{ text: 'Guaranteed income of $10,000 per month', source: '', checkedAt: '', confidence: 'low', reviewerApproved: false }])).toHaveLength(1);
    const blocked = buildCompliancePayload({ ...base, claims: [{ text: 'Guaranteed income of $10,000 per month', source: '', checkedAt: '', confidence: 'low', reviewerApproved: false }], assets: [], controls: { ...controls, rightsCleared: false, disclosurePresent: false, disclosurePlacement: '' } });
    expect(blocked.checks.find((item) => item.id === 'rights')?.status).toBe('blocked');
    expect(blocked.checks.find((item) => item.id === 'claims')?.status).toBe('blocked');
    expect(blocked.checks.find((item) => item.id === 'disclosure')?.status).toBe('blocked');
    expect(reviewStatus(blocked)).toBe('blocked');
  });
});
