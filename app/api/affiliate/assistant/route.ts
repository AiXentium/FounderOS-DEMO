import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/data';
import { searchViatorMcp } from '@/lib/connectors/viator-mcp';

export const runtime = 'nodejs';

/** Small, auditable Affiliate Studio operator. It executes only the existing
 * discovery and campaign primitives; it never publishes or books automatically. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });
  const query = message.replace(/^(search|find|discover)\s+/i, '').slice(0, 180) || 'travel experiences';
  const wantsCampaign = /campaign|promot|holiday|holidays|season|schedule|calendar/i.test(message);
  try {
    const products = await searchViatorMcp(query);
    const db = getDb();
    products.forEach((product) => db.affiliateProducts.create({ ...product, createdAt: new Date().toISOString() }));
    let campaign;
    if (wantsCampaign && products.length) {
      campaign = { id: randomUUID(), name: `Affiliate plan: ${query}`, productIds: products.map((p) => p.id), platforms: ['instagram', 'tiktok', 'linkedin'], status: 'draft', createdAt: new Date().toISOString() };
      db.affiliateCampaigns.create(campaign);
    }
    const siteBrief = wantsCampaign ? {
      title: 'Spain Coast Family Travel Guide',
      sections: ['Best coastal destinations', 'Family-friendly food and beach clothing', 'Hotels and beach essentials', 'Seasonal trends and itinerary ideas'],
      status: 'draft — requires review before publishing',
    } : undefined;
    const reply = campaign
      ? `I found ${products.length} live Viator experiences and created a draft campaign. I also prepared a Spain-coast family promotion brief with food, hotels, beach clothing, and seasonal trend sections. Amazon product automation is not connected yet, so I will not invent or import Amazon products. Review the live experiences and add verified SiteStripe links before publishing.`
      : `I found ${products.length} live Viator experiences for “${query}”. Tell me to create the campaign when you want a draft brief.`;
    return NextResponse.json({ reply, products, campaign, siteBrief, actions: ['viator.search', ...(campaign ? ['affiliate.campaign.create', 'website.section.prepare'] : [])], warnings: ['Amazon product search requires a verified SiteStripe link or Creators API credentials.'] });
  } catch (error) {
    return NextResponse.json({ reply: 'I could not complete a live network search. Check the Viator connection and try again.', error: error instanceof Error ? error.message : 'network request failed', products: [] }, { status: 502 });
  }
}
