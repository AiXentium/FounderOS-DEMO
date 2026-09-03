import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { searchViator, viatorConfigured } from '@/lib/connectors/viator';
import { searchViatorMcp } from '@/lib/connectors/viator-mcp';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query.toLowerCase() : '';
  const provider = body.provider === 'viator' || body.provider === 'manual' ? body.provider : 'all';
  if (provider === 'manual') return NextResponse.json({ mode: 'manual', provider, query, products: [] });
  if (provider === 'viator' || provider === 'all') {
    // Prefer the credentialed Partner API, but keep the official Viator MCP
    // path available for local and hosted OS instances without a Partner API key.
    try {
      const products = viatorConfigured() ? await searchViator(query) : await searchViatorMcp(query);
      products.forEach((product) => getDb().affiliateProducts.create({ ...product, createdAt: new Date().toISOString() }));
      return NextResponse.json({ mode: 'live', provider: viatorConfigured() ? 'viator' : 'viator-mcp', query, products });
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
  return NextResponse.json({ mode: 'unavailable', provider, query, products: [], error: 'No affiliate product provider is connected.' }, { status: 503 });
}
