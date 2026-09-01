/** Keyless affiliate/social agency adapters. Replace these implementations with
 * provider calls once credentials are added; the UI remains unchanged. */
export type AffiliateProvider = 'amazon' | 'aliexpress' | 'impact' | 'cj' | 'clickbank' | 'manual';

export function affiliateMode(): 'demo' | 'live' {
  return process.env.AFFILIATE_MODE === 'live' ? 'live' : 'demo';
}

export function configuredProviders(): AffiliateProvider[] {
  const providers: Array<[AffiliateProvider, string]> = [
    ['amazon', 'AMAZON_ASSOCIATE_TAG'], ['aliexpress', 'ALIEXPRESS_API_KEY'],
    ['impact', 'IMPACT_ACCOUNT_ID'], ['cj', 'CJ_API_KEY'], ['clickbank', 'CLICKBANK_API_KEY'],
  ];
  return providers.filter(([, key]) => Boolean(process.env[key])).map(([provider]) => provider).concat(['manual']);
}

export function demoCompetitors() {
  return [
    { handle: '@competitor_one', platform: 'instagram', posts30d: 22, engagement: 4.8, followers: 18400, note: 'Demo record — connect provider later' },
    { handle: '@competitor_two', platform: 'tiktok', posts30d: 35, engagement: 6.1, followers: 42100, note: 'Demo record — connect provider later' },
    { handle: '@competitor_three', platform: 'youtube', posts30d: 8, engagement: 3.7, followers: 9700, note: 'Demo record — connect provider later' },
  ];
}
