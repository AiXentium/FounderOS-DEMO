/** Optional OmniRoute OpenAI-compatible gateway configuration. */
export function omniRouteConfig() {
  const baseUrl = process.env.OMNIROUTE_BASE_URL?.trim();
  return { configured: Boolean(baseUrl), baseUrl: baseUrl || null, apiKeyConfigured: Boolean(process.env.OMNIROUTE_API_KEY), setupUrl: 'https://github.com/AiXentium/OmniRoute', capabilities: ['OpenAI-compatible routing', 'provider fallback', 'quota-aware gateway integration'] };
}
