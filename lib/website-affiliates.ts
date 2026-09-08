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

const STOP_WORDS = new Set(['about', 'best', 'blog', 'complete', 'destination', 'destinations', 'guide', 'html', 'index', 'lets', 'miles', 'page', 'plan', 'talk', 'things', 'tour', 'tours', 'travel', 'trip', 'with', 'your']);
export function detectPageTopic(html: string, pagePath: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, ' ') ?? '';
  const hero = html.match(/<(?:section|div)[^>]*(?:hero|masthead)[^>]*>([\s\S]{0,8000}?)<\/(?:section|div)>/i)?.[1].replace(/<[^>]+>/g, ' ') ?? '';
  const pathWords = pagePath.replace(/[\/_-]+/g, ' ');
  const weighted = `${pathWords} ${pathWords} ${title} ${title} ${h1} ${hero}`.toLowerCase();
  const destination = DESTINATIONS.find(item => weighted.includes(item.toLowerCase()));
  const destinationWords = new Set(destination?.toLowerCase().split(/\s+/) || []);
  const storyTerms = [...new Set(`${pathWords} ${title} ${h1}`.toLowerCase().replace(/<[^>]+>/g, ' ').match(/[a-z]{4,}/g) || [])]
    .filter(word => !STOP_WORDS.has(word) && !destinationWords.has(word)).slice(0, 8);
  return { destination, storyTerms, topic: [destination, ...storyTerms.slice(0, 4), 'travel experiences'].filter(Boolean).join(' ') };
}

export function matchingViatorOffers(products: Array<Record<string, unknown>>, destination?: string, storyTerms: string[] = [], limit = 3): PageAffiliateOffer[] {
  if (!destination) return [];
  const needle = destination.toLowerCase();
  return products.filter(product => {
      const haystack = `${product.name ?? ''} ${product.description ?? ''}`.toLowerCase();
      const specificStory = storyTerms.filter(term => term.length >= 5);
      return haystack.includes(needle) && (!specificStory.length || specificStory.some(term => haystack.includes(term)));
    })
    .filter(product => {
      try {
        const source = new URL(String(product.url ?? '')); const tracked = new URL(String(product.trackedUrl ?? ''));
        const viator = (host: string) => host === 'viator.com' || host.endsWith('.viator.com');
        const hasTracking = [...tracked.searchParams.keys()].some(key => ['mcid', 'pid', 'campaign', 'medium'].includes(key.toLowerCase()));
        return source.protocol === 'https:' && tracked.protocol === 'https:' && viator(source.hostname) && (viator(tracked.hostname) || hasTracking);
      } catch { return false; }
    })
    .slice(0, limit)
    .map(product => PageAffiliateOfferSchema.parse({
      id: String(product.id), provider: 'viator', title: String(product.name), destination,
      sourceUrl: String(product.url), trackedUrl: String(product.trackedUrl),
      price: typeof product.price === 'string' ? product.price : undefined,
      imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : undefined,
      matchReason: `The experience matches ${destination}${storyTerms.length ? ` and the page topic (${storyTerms.slice(0, 3).join(', ')})` : ''}.`, status: 'proposed', verifiedAt: new Date().toISOString(),
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
