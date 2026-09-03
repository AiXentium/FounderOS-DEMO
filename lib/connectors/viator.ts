export type ViatorProduct = {
  id: string;
  name: string;
  source: 'Viator';
  url: string;
  trackedUrl: string;
  price?: string;
  commission?: string;
  status: 'live';
};

export function viatorConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.VIATOR_API_KEY && env.VIATOR_PARTNER_ID);
}

export async function searchViator(query: string, env: Record<string, string | undefined> = process.env): Promise<ViatorProduct[]> {
  if (!viatorConfigured(env)) return [];
  const response = await fetch('https://api.viator.com/partner/search/freetext', {
    method: 'POST',
    headers: {
      accept: 'application/json;version=2.0',
      'accept-language': 'en-US',
      'content-type': 'application/json',
      'exp-api-key': env.VIATOR_API_KEY!,
    },
    body: JSON.stringify({
      searchTerm: query || 'travel experiences',
      searchTypes: [{ searchType: 'PRODUCTS', pagination: { start: 1, count: 10 } }],
      productSorting: { sort: 'DEFAULT', order: 'DESCENDING' },
      currency: 'USD',
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Viator API returned ${response.status}`);
  const body = (await response.json()) as { products?: Array<Record<string, unknown>> };
  return (body.products ?? []).map((product) => {
    const code = String(product.productCode ?? product.id ?? '');
    const title = String(product.title ?? product.name ?? 'Viator experience');
    const url = `https://www.viator.com/tours/-/${code}`;
    return {
      id: `viator-${code}`,
      name: title,
      source: 'Viator',
      url,
      trackedUrl: `${url}?mcid=${encodeURIComponent(env.VIATOR_PARTNER_ID!)}`,
      price: product.fromPrice ? `$${product.fromPrice}` : undefined,
      commission: 'Viator partner rate',
      status: 'live',
    };
  });
}

export function viatorStatus(env: Record<string, string | undefined> = process.env) {
  return viatorConfigured(env)
    ? { state: 'connected', detail: 'Viator Partner API credentials configured' }
    : { state: 'not_configured', detail: 'Set VIATOR_API_KEY and VIATOR_PARTNER_ID' };
}
