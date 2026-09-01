import { NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({ productName: z.string().min(1), platform: z.string().min(1).default('instagram'), affiliateUrl: z.string().url() });

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { productName, platform, affiliateUrl } = parsed.data;
  return NextResponse.json({ caption: `Upgrade your setup with ${productName}. A smart pick for creators who want better results without adding complexity. See it here: ${affiliateUrl} #affiliate #${platform}` });
}
