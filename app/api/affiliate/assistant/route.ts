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
    return NextResponse.json({ reply: campaign ? `I found ${products.length} live Viator experiences and created a draft campaign. Nothing has been published. Review the products and schedule before activating it.` : `I found ${products.length} live Viator experiences for “${query}”. Select one to build a campaign.`, products, campaign, actions: ['viator.search', ...(campaign ? ['affiliate.campaign.create'] : [])] });
  } catch (error) {
    return NextResponse.json({ reply: 'I could not complete a live network search. Check the Viator connection and try again.', error: error instanceof Error ? error.message : 'network request failed', products: [] }, { status: 502 });
  }
}
