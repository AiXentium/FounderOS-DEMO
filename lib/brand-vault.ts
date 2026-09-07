export type BrandBlueprint = {
  businessName: string;
  businessType: string;
  audience: string;
  offer: string;
  positioning: string;
  voice: string;
  visualDirection: string;
  imageDirection: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  logoNotes: string;
  frontendTemplateId: string;
  backendTemplateId: string;
  fullStackTemplateId: string;
  channels: string[];
  approvalStatus: 'draft' | 'review' | 'approved';
};

export type BrandVaultRecord = {
  id: string;
  workspaceId: string;
  businessName: string;
  businessType: string;
  status: 'draft' | 'review' | 'approved';
  blueprint: BrandBlueprint;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_BRAND_BLUEPRINT: BrandBlueprint = {
  businessName: '',
  businessType: '',
  audience: '',
  offer: '',
  positioning: '',
  voice: 'Clear, useful, warm, specific, and trustworthy.',
  visualDirection: 'Editorial, confident, spacious, and conversion-ready.',
  imageDirection: 'Use original, client-supplied, or rights-cleared imagery. Replace every placeholder before publishing.',
  primaryColor: '#1c211d',
  secondaryColor: '#f4f0e7',
  accentColor: '#d9683a',
  headingFont: 'Editorial serif',
  bodyFont: 'Readable sans-serif',
  logoNotes: '',
  frontendTemplateId: 'editorial-studio',
  backendTemplateId: 'agency-ops',
  fullStackTemplateId: 'affiliate-magazine',
  channels: ['Website', 'Blog', 'Email', 'YouTube', 'Instagram', 'TikTok', 'Pinterest'],
  approvalStatus: 'draft',
};

export function buildInitialBrandBlueprint(input: { businessName?: string; businessType?: string; audience?: string; offer?: string; details?: string }): BrandBlueprint {
  const businessName = input.businessName?.trim() || '';
  const businessType = input.businessType?.trim() || '';
  const details = input.details?.trim() || '';
  return {
    ...DEFAULT_BRAND_BLUEPRINT,
    businessName,
    businessType,
    audience: input.audience?.trim() || '',
    offer: input.offer?.trim() || '',
    positioning: businessType ? `${businessName || 'This business'} helps its audience make a confident decision about ${businessType}.` : '',
    logoNotes: details ? `Reference notes from initial setup: ${details}` : '',
  };
}
