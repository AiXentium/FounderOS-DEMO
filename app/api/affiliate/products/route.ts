import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';

const ImportSchema = z.object({ url: z.string().url(), name: z.string().min(1).optional(), source: z.string().min(1).optional() });

export async function GET() {
  return NextResponse.json({ products: getDb().affiliateProducts.all() });
}

export async function POST(request: Request) {
  const parsed = ImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const id = randomUUID();
  const trackedUrl = `${parsed.data.url}${parsed.data.url.includes('?') ? '&' : '?'}utm_source=founderos&utm_medium=affiliate`;
  const product = { id, name: parsed.data.name ?? 'Imported product', source: parsed.data.source ?? 'URL import', url: parsed.data.url, trackedUrl, createdAt: new Date().toISOString() };
  getDb().affiliateProducts.create(product);
  return NextResponse.json({ product }, { status: 201 });
}
