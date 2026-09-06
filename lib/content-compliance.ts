/** Compliance and quality controls for content before it reaches a channel. */

export const DISCLOSURE_TEXT = 'This post contains affiliate links. I may earn a commission if you purchase through my link.';

export const COMPLIANCE_STAGES = [
  'draft',
  'originality_check',
  'rights_check',
  'claim_check',
  'disclosure_check',
  'platform_check',
  'human_approval',
  'publish',
  'monitor',
] as const;

export type ComplianceStage = (typeof COMPLIANCE_STAGES)[number];
export type GateStatus = 'pass' | 'needs_review' | 'blocked';
export type ReviewStatus = 'draft' | 'ready_for_approval' | 'approved' | 'blocked' | 'published';
export type RightsStatus = 'cleared' | 'pending' | 'restricted' | 'unknown';
export type ClaimConfidence = 'high' | 'medium' | 'low';

export type ProvenanceRecord = {
  id: string;
  assetName: string;
  assetType: string;
  source: string;
  rightsStatus: RightsStatus;
  license: string;
  expiresAt: string | null;
  attribution: string;
  notes: string;
};

export type ClaimRecord = {
  text: string;
  source: string;
  checkedAt: string;
  confidence: ClaimConfidence;
  reviewerApproved: boolean;
};

export type OriginalityInput = {
  originalResearch: boolean;
  newCommentary: boolean;
  distinctScript: boolean;
  meaningfulEditing: boolean;
  uniqueVisuals: boolean;
  educationalValue: boolean;
};

export type ComplianceControls = {
  rightsCleared: boolean;
  claimsSubstantiated: boolean;
  disclosurePresent: boolean;
  disclosurePlacement: 'video' | 'caption' | 'email' | 'page' | 'near_recommendation' | '';
  platformReviewed: boolean;
  humanApproved: boolean;
};

export type ComplianceCheck = {
  id: string;
  label: string;
  status: GateStatus;
  evidence: string;
  required: boolean;
};

export type CompliancePayload = {
  affiliate: boolean;
  originality: OriginalityInput & { score: number; breakdown: Record<keyof OriginalityInput, number> };
  assets: ProvenanceRecord[];
  claims: ClaimRecord[];
  controls: ComplianceControls;
  disclosureText: string;
  checks: ComplianceCheck[];
  platformRules: Record<string, string[]>;
  accountHealth: { paused: boolean; reasons: string[]; warningCount: number };
  policyVersion: string;
};

export const PLATFORM_RULES: Record<string, string[]> = {
  youtube: ['Commercial rights confirmed for all audio and visual assets.', 'Reused or repetitive content has meaningful original commentary and editing.', 'Paid promotion or affiliate relationship is disclosed near the recommendation.'],
  tiktok: ['Commercial-content disclosure setting is enabled where required.', 'No fake engagement, bulk account behavior, or recommendation manipulation.', 'Original footage, commentary, music rights, and AI-media labeling are reviewed.'],
  instagram: ['Branded-content and affiliate disclosure is visible in the post or reel.', 'Music, image, testimonial, and AI-media rights are documented.', 'Caption and link behavior match the approved funnel.'],
  facebook: ['Commercial relationship and material claims are clearly disclosed.', 'Rights are documented for every asset and music track.', 'No misleading income, health, or performance claims.'],
  linkedin: ['Sponsored or affiliate relationship is clear to the reader.', 'Claims and testimonials have a source and reviewer.', 'The post provides professional value rather than repetitive promotional copy.'],
  twitter: ['Commercial relationship is disclosed in the post copy.', 'Links, claims, and media rights are reviewed.', 'No deceptive engagement or repetitive bulk posting.'],
};

const RISKY_CLAIM_PATTERNS = [
  /guaranteed?\s+(?:income|results?|approval|savings?)/i,
  /make\s+\$?\s*[\d,]+(?:\s*per\s*(?:month|week|day))?/i,
  /\b(?:this|it)\s+always\s+works\b/i,
  /\bbest\s+(?:product|service|card|route|deal)\b/i,
  /\b(?:cure|treats?|prevents?)\b/i,
  /\b(?:risk[- ]free|no risk|double your money|zero risk)\b/i,
];

export function findRiskyClaims(claims: ClaimRecord[]): string[] {
  return claims.filter((claim) => RISKY_CLAIM_PATTERNS.some((pattern) => pattern.test(claim.text))).map((claim) => claim.text);
}

export function scoreOriginality(input: OriginalityInput) {
  const keys = Object.keys(input) as Array<keyof OriginalityInput>;
  const breakdown = Object.fromEntries(keys.map((key) => [key, input[key] ? 100 / keys.length : 0])) as Record<keyof OriginalityInput, number>;
  const score = Math.round(keys.reduce((total, key) => total + breakdown[key], 0));
  return { score, breakdown };
}

function check(id: string, label: string, status: GateStatus, evidence: string): ComplianceCheck {
  return { id, label, status, evidence, required: true };
}

export function buildCompliancePayload(input: {
  platforms: string[];
  affiliate: boolean;
  claims: ClaimRecord[];
  assets: ProvenanceRecord[];
  originality: OriginalityInput;
  controls: ComplianceControls;
  accountHealth?: { paused: boolean; reasons: string[]; warningCount: number };
  policyVersion?: string;
}): CompliancePayload {
  const originality = { ...input.originality, ...scoreOriginality(input.originality) };
  const riskyClaims = findRiskyClaims(input.claims);
  const validClaims = input.claims.length === 0 || input.claims.every((claim) => Boolean(claim.source && claim.checkedAt && claim.reviewerApproved));
  const rightsValid = input.assets.length > 0 && input.assets.every((asset) => asset.rightsStatus === 'cleared' && Boolean(asset.source));
  const health = input.accountHealth ?? { paused: false, reasons: [], warningCount: 0 };
  const controls = input.controls;
  const platformRules = Object.fromEntries(input.platforms.map((platform) => [platform, PLATFORM_RULES[platform] ?? ['Platform-specific commercial, rights, claims, and posting rules require review.']]));

  const checks: ComplianceCheck[] = [
    check('originality', 'Originality score', originality.score >= 70 ? 'pass' : 'blocked', `${originality.score}/100 · research, commentary, script, editing, visuals, and value.`),
    check('rights', 'Rights and provenance', rightsValid && controls.rightsCleared ? 'pass' : input.assets.length === 0 ? 'blocked' : 'needs_review', input.assets.length === 0 ? 'Add every image, clip, audio, voice, logo, testimonial, and AI asset to the provenance ledger.' : `${input.assets.length} asset${input.assets.length === 1 ? '' : 's'} recorded; all rights must be cleared.`),
    check('claims', 'Claims substantiation', riskyClaims.length > 0 ? 'blocked' : validClaims && (input.claims.length === 0 || controls.claimsSubstantiated) ? 'pass' : 'needs_review', riskyClaims.length > 0 ? `Risky claims require removal or documented evidence: ${riskyClaims.join(' · ')}` : input.claims.length === 0 ? 'No material claims registered.' : 'Every material claim needs a source, date, confidence, and reviewer approval.'),
    check('disclosure', 'Disclosure placement', !input.affiliate || (controls.disclosurePresent && controls.disclosurePlacement !== '') ? 'pass' : 'blocked', !input.affiliate ? 'No affiliate relationship declared.' : `${DISCLOSURE_TEXT} Placement: ${controls.disclosurePlacement || 'not selected'}.`),
    check('platform', 'Platform checklist', input.platforms.length > 0 && controls.platformReviewed ? 'pass' : 'needs_review', input.platforms.length > 0 ? `${input.platforms.length} platform checklist${input.platforms.length === 1 ? '' : 's'} selected.` : 'Select at least one destination platform.'),
    check('account_health', 'Account health', health.paused ? 'blocked' : 'pass', health.paused ? health.reasons.join(' · ') : 'No pause threshold crossed in recorded account-health events.'),
  ];

  return {
    affiliate: input.affiliate,
    originality,
    assets: input.assets,
    claims: input.claims,
    controls,
    disclosureText: DISCLOSURE_TEXT,
    checks,
    platformRules,
    accountHealth: health,
    policyVersion: input.policyVersion ?? '2026-09-value-first-v1',
  };
}

export function reviewStatus(payload: CompliancePayload): ReviewStatus {
  const failed = payload.checks.some((item) => item.status === 'blocked');
  const ready = payload.checks.every((item) => item.status === 'pass');
  if (failed) return 'blocked';
  if (ready && payload.controls.humanApproved) return 'approved';
  if (ready) return 'ready_for_approval';
  return 'draft';
}

export function canPublishReview(review: { status: string; payload: CompliancePayload }, platforms: string[]): { allowed: boolean; reason?: string } {
  if (review.status !== 'approved' || !review.payload.controls.humanApproved) return { allowed: false, reason: 'Content must pass every compliance check and receive human approval before publishing.' };
  if (platforms.some((platform) => !review.payload.platformRules[platform])) return { allowed: false, reason: 'The approved review does not cover every requested platform.' };
  if (review.payload.accountHealth.paused) return { allowed: false, reason: 'Publishing is paused because account-health thresholds were crossed.' };
  return { allowed: true };
}
