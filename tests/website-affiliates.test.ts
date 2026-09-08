import { describe, expect, it } from 'vitest';
import { addAffiliateSection, detectPageTopic, matchingViatorOffers } from '@/lib/website-affiliates';

describe('website affiliate revisions', () => {
  it('detects the page destination and rejects unrelated tours', () => {
    const topic = detectPageTopic('<html><head><title>Venice Travel Guide</title></head><body><h1>Plan Venice</h1></body></html>', 'destinations/venice/index.html');
    expect(topic.destination).toBe('Venice');
    const offers = matchingViatorOffers([
      { id: 'v1', name: 'Venice Grand Canal Small Group Tour', url: 'https://www.viator.com/tours/-/V1', trackedUrl: 'https://www.viator.com/tours/-/V1?mcid=partner' },
      { id: 'r1', name: 'Rome Colosseum Tour', url: 'https://www.viator.com/tours/-/R1', trackedUrl: 'https://www.viator.com/tours/-/R1?mcid=partner' },
    ], topic.destination);
    expect(offers.map(offer => offer.id)).toEqual(['v1']);
  });

  it('adds exact tracked URLs, sponsored attributes and one nearby disclosure', () => {
    const html = addAffiliateSection('<html><body><main>Story</main><footer>Footer</footer></body></html>', [{ id: 'v1', provider: 'viator', title: 'Venice Walking Tour', destination: 'Venice', sourceUrl: 'https://www.viator.com/tours/-/V1', trackedUrl: 'https://www.viator.com/tours/-/V1?mcid=partner', matchReason: 'Venice title match', status: 'proposed', verifiedAt: new Date().toISOString() }]);
    expect(html).toContain('href="https://www.viator.com/tours/-/V1?mcid=partner"');
    expect(html).toContain('rel="sponsored nofollow noopener"');
    expect(html).toContain('This page contains affiliate links');
    expect(html.indexOf('Relevant booking options')).toBeLessThan(html.indexOf('<footer'));
  });

  it('does not add offers when destination confidence is missing', () => {
    const original = '<html><body><h1>Travel More</h1></body></html>';
    expect(matchingViatorOffers([{ id: 'v', name: 'Random tour' }], undefined)).toEqual([]);
    expect(addAffiliateSection(original, [])).toBe(original);
  });
});
