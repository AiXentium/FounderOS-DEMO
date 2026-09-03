import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/data';
import { searchViator, viatorConfigured } from '@/lib/connectors/viator';
import { searchViatorMcp } from '@/lib/connectors/viator-mcp';

const demo = [
  ['Creator microphone', 'Amazon', '$79.99', '4.5%', 'audio creator podcast'],
  ['Portable lighting kit', 'AliExpress', '$28.40', '12%', 'creator studio video'],
  ['Ergonomic laptop stand', 'Amazon', '$34.99', '5%', 'desk productivity'],
  ['AI writing workspace', 'Impact', '$19/mo', '25%', 'software productivity'],
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query.toLowerCase() : '';
  const provider = body.provider === 'viator' || body.provider === 'manual' ? body.provider : 'all';
  if (provider === 'manual') return NextResponse.json({ mode: 'manual', provider, query, products: [] });
  if (viatorConfigured()) {
    try {
      const products = await searchViator(query);
      products.forEach((product) => getDb().affiliateProducts.create({ ...product, createdAt: new Date().toISOString() }));
      return NextResponse.json({ mode: 'live', provider: 'viator', query, products });
    } catch (error) {
      try {
        const products = await searchViatorMcp(query);
        products.forEach((product) => getDb().affiliateProducts.create({ ...product, createdAt: new Date().toISOString() }));
        return NextResponse.json({ mode: 'live', provider: 'viator-mcp', warning: error instanceof Error ? error.message : 'Affiliate API unavailable', query, products });
      } catch (mcpError) {
        return NextResponse.json({ mode: 'live', provider: 'viator', error: mcpError instanceof Error ? mcpError.message : 'Viator request failed', products: [] }, { status: 502 });
      }
    }
  }
  const matches = demo.filter((p) => !query || p.join(' ').toLowerCase().includes(query));
  const db = getDb();
  const products = matches.map(([name, source, price, commission, keywords]) => {
    const id = randomUUID(); const url = `https://example.com/products/${id}`;
    const product = { id, name, source, url, trackedUrl: `${url}?utm_source=founderos&utm_medium=affiliate&utm_campaign=discovery`, price, commission, status: 'discovered', createdAt: new Date().toISOString() };
    db.affiliateProducts.create(product); return product;
  });
  return NextResponse.json({ mode: 'demo', query, products });
}
