import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/data';

const demo = [
  ['Creator microphone', 'Amazon', '$79.99', '4.5%', 'audio creator podcast'],
  ['Portable lighting kit', 'AliExpress', '$28.40', '12%', 'creator studio video'],
  ['Ergonomic laptop stand', 'Amazon', '$34.99', '5%', 'desk productivity'],
  ['AI writing workspace', 'Impact', '$19/mo', '25%', 'software productivity'],
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query.toLowerCase() : '';
  const matches = demo.filter((p) => !query || p.join(' ').toLowerCase().includes(query));
  const db = getDb();
  const products = matches.map(([name, source, price, commission, keywords]) => {
    const id = randomUUID(); const url = `https://example.com/products/${id}`;
    const product = { id, name, source, url, trackedUrl: `${url}?utm_source=founderos&utm_medium=affiliate&utm_campaign=discovery`, price, commission, status: 'discovered', createdAt: new Date().toISOString() };
    db.affiliateProducts.create(product); return product;
  });
  return NextResponse.json({ mode: 'demo', query, products });
}
