export const CONTENT_POLICY_SOURCES = [
  { id: 'youtube-monetization', name: 'YouTube monetization guidance', url: 'https://support.google.com/youtube/answer/2490020', version: 'operator-reviewed-2026-09' },
  { id: 'youtube-inauthentic', name: 'YouTube channel monetization policies', url: 'https://support.google.com/youtube/answer/1311392', version: 'operator-reviewed-2026-09' },
  { id: 'ftc-disclosures', name: 'FTC influencer disclosure guidance', url: 'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers', version: 'operator-reviewed-2026-09' },
  { id: 'tiktok-guidelines', name: 'TikTok Community Guidelines', url: 'https://www.tiktok.com/community-guidelines', version: 'operator-reviewed-2026-09' },
] as const;

export const POLICY_UPDATE_LOOP = ['Official source', 'Policy diff', 'Human approval', 'Update rules', 'Update prompts', 'Update templates', 'Re-check queued content', 'Notify agents'] as const;
