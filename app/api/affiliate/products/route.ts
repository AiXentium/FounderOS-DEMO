import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';

const ImportSchema = z.object({ url: z.string().url(), trackedUrl: z.string().url().optional(), name: z.string().min(1).optional(), source: z.string().min(1).optional(), provider: z.enum(['amazon', 'manual']).optional() });
const ReviewSchema = z.object({ id: z.string().min(1), status: z.enum(['approved', 'rejected', 'needs review']) });

export async function GET() {
  return NextResponse.json({ products: getDb().affiliateProducts.all() });
}

export async function POST(request: Request) {
  const parsed = ImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const id = randomUUID();
  const isAmazon = parsed.data.provider === 'amazon' || /(^|\.)amazon\.[a-z.]+$|(^|\.)amzn\.to$/i.test(new URL(parsed.data.url).hostname);
  if (isAmazon && !parsed.data.trackedUrl) return NextResponse.json({ error: 'Paste the complete manual Amazon affiliate link as trackedUrl. Amazon API access is not required.' }, { status: 400 });
  const trackedUrl = parsed.data.trackedUrl ?? parsed.data.url;
  if (isAmazon && !/(^|\.)amazon\.[a-z.]+$|(^|\.)amzn\.to$/i.test(new URL(trackedUrl).hostname)) return NextResponse.json({ error: 'The Amazon trackedUrl must be a complete amazon.* or amzn.to affiliate link.' }, { status: 400 });
  const product = { id, name: parsed.data.name ?? 'Imported product', source: isAmazon ? 'Amazon manual' : parsed.data.source ?? 'Manual', url: parsed.data.url, trackedUrl, status: 'needs review', createdAt: new Date().toISOString() };
  getDb().affiliateProducts.create(product);
  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = ReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const product = db.affiliateProducts.all().find((item: any) => item.id === parsed.data.id);
  if (!product) return NextResponse.json({ error: 'Affiliate product not found.' }, { status: 404 });
  db.affiliateProducts.updateStatus(parsed.data.id, parsed.data.status);
  return NextResponse.json({ product: db.affiliateProducts.all().find((item: any) => item.id === parsed.data.id) });
}
