import { z } from 'zod';

export const AFFILIATE_DISCLOSURE = 'This page contains affiliate links. If you book or buy through them, we may earn a commission at no extra cost to you.';

export const PageAffiliateOfferSchema = z.object({
  id: z.string(),
  provider: z.enum(['viator', 'amazon']),
  title: z.string(),
  destination: z.string(),
  sourceUrl: z.string().url(),
  trackedUrl: z.string().url(),
  price: z.string().optional(),
  imageUrl: z.string().url().optional(),
  matchReason: z.string(),
  status: z.enum(['proposed', 'approved']).default('proposed'),
  verifiedAt: z.string(),
});
export type PageAffiliateOffer = z.infer<typeof PageAffiliateOfferSchema>;

const DESTINATIONS = ['Venice', 'Madrid', 'Rome', 'Florence', 'Paris', 'Barcelona', 'Capri', 'Positano', 'Verona', 'Tuscany', 'Segovia', 'Cappadocia', 'French Riviera', 'Bellagio', 'Burano'];

export function detectPageTopic(html: string, pagePath: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, ' ') ?? '';
  const hero = html.match(/<(?:section|div)[^>]*(?:hero|masthead)[^>]*>([\s\S]{0,8000}?)<\/(?:section|div)>/i)?.[1].replace(/<[^>]+>/g, ' ') ?? '';
  const pathWords = pagePath.replace(/[\/_-]+/g, ' ');
  const weighted = `${pathWords} ${pathWords} ${title} ${title} ${h1} ${hero}`.toLowerCase();
  const destination = DESTINATIONS.find(item => weighted.includes(item.toLowerCase()));
  return { destination, topic: [destination, title || h1 || pathWords].filter(Boolean).join(' travel experiences') };
}

export function matchingViatorOffers(products: Array<Record<string, unknown>>, destination?: string, limit = 3): PageAffiliateOffer[] {
  if (!destination) return [];
  const needle = destination.toLowerCase();
  return products.filter(product => String(product.name ?? '').toLowerCase().includes(needle))
    .filter(product => /^https:\/\//.test(String(product.url ?? '')) && /^https:\/\//.test(String(product.trackedUrl ?? '')))
    .slice(0, limit)
    .map(product => PageAffiliateOfferSchema.parse({
      id: String(product.id), provider: 'viator', title: String(product.name), destination,
      sourceUrl: String(product.url), trackedUrl: String(product.trackedUrl),
      price: typeof product.price === 'string' ? product.price : undefined,
      imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : undefined,
      matchReason: `The experience title explicitly matches ${destination}.`, status: 'proposed', verifiedAt: new Date().toISOString(),
    }));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function addAffiliateSection(html: string, offers: PageAffiliateOffer[]) {
  if (!offers.length) return html;
  const cards = offers.map(offer => `<article class="ltmt-affiliate-card" data-affiliate-offer-id="${escapeHtml(offer.id)}"><h3>${escapeHtml(offer.title)}</h3>${offer.price ? `<p>From ${escapeHtml(offer.price)}</p>` : ''}<a href="${escapeHtml(offer.trackedUrl)}" rel="sponsored nofollow noopener" target="_blank">${offer.provider === 'viator' ? 'Check availability on Viator' : 'View product on Amazon'}</a></article>`).join('');
  const section = `<section class="ltmt-affiliate-options" aria-labelledby="ltmt-booking-options"><style>.ltmt-affiliate-options{max-width:1200px;margin:3rem auto;padding:2rem 5%;font-family:inherit}.ltmt-affiliate-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.ltmt-affiliate-card{border:1px solid #ddd;border-radius:12px;padding:1.25rem}.ltmt-affiliate-card a{display:inline-block;margin-top:.5rem;font-weight:700}.ltmt-affiliate-disclosure{font-size:.875rem;opacity:.8}</style><h2 id="ltmt-booking-options">Relevant booking options</h2><p class="ltmt-affiliate-disclosure">${escapeHtml(AFFILIATE_DISCLOSURE)}</p><div class="ltmt-affiliate-grid">${cards}</div></section>`;
  if (/<footer\b/i.test(html)) return html.replace(/<footer\b/i, `${section}<footer`);
  return html.replace(/<\/body>/i, `${section}</body>`);
}
