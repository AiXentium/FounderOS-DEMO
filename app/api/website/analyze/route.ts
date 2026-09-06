import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertSafePublicUrl } from '@/lib/url-safety';

const Schema = z.object({ url: z.string().trim().url().max(2048) });

async function readHtml(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const next = await reader.read();
      if (next.done) break;
      const remaining = maxBytes - total;
      const chunk = next.value.slice(0, remaining);
      chunks.push(chunk);
      total += chunk.byteLength;
      if (chunk.byteLength < next.value.byteLength) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
}

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const target = await assertSafePublicUrl(parsed.data.url);
    const res = await fetch(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: { 'user-agent': 'FounderOS-Website-Analyzer/1.0' },
    });
    if (res.status >= 300 && res.status < 400) return NextResponse.json({ error: 'redirects are not supported; submit the final public URL' }, { status: 422 });
    const html = await readHtml(res, 2_000_000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? '';
    const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].slice(0, 20).map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    return NextResponse.json({ url: target.toString(), title, description, headings, htmlBytes: html.length, mode: 'metadata' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'analysis failed' }, { status: 502 });
  }
}
