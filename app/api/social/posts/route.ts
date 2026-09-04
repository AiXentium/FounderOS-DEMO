import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { SocialPlatformSchema, type SocialPost } from '@/lib/schemas';
import { publishThroughZernio } from '@/lib/connectors/zernio';

export const dynamic = 'force-dynamic';

/** The post queue, newest first. */
export async function GET() {
  return NextResponse.json({ posts: getDb().socialPosts.all() });
}

const CreateSchema = z.object({
  caption: z.string().min(1, 'caption is required'),
  platforms: z.array(SocialPlatformSchema).min(1, 'pick at least one platform'),
  mediaUrl: z.string().url().nullish(),
  scheduledFor: z.string().nullish(),
  /** Explicit live publish. Omit to keep the existing local approval queue. */
  publishNow: z.boolean().optional().default(false),
});

/**
 * Queue by default. When the operator explicitly chooses publish-now or a
 * schedule, call Zernio's real posts endpoint and persist the verified local
 * result. A missing Instagram/Facebook OAuth account fails clearly instead of
 * claiming the post was published.
 */
export async function POST(request: Request) {
  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const liveRequested = parsed.data.publishNow || Boolean(parsed.data.scheduledFor);
  let providerResult: unknown = null;
  if (liveRequested) {
    try {
      providerResult = await publishThroughZernio({
        caption: parsed.data.caption,
        platforms: parsed.data.platforms,
        mediaUrl: parsed.data.mediaUrl ?? null,
        publishNow: parsed.data.publishNow,
        scheduledFor: parsed.data.scheduledFor ?? null,
      });
    } catch (error) {
      const status = typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : 502;
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status });
    }
  }

  const post: SocialPost = {
    id: typeof (providerResult as { post?: { _id?: unknown } })?.post?._id === 'string'
      ? (providerResult as { post: { _id: string } }).post._id
      : randomUUID(),
    caption: parsed.data.caption,
    mediaUrl: parsed.data.mediaUrl ?? null,
    platforms: parsed.data.platforms,
    status: parsed.data.publishNow ? 'published' : 'queued',
    scheduledFor: parsed.data.scheduledFor ?? null,
    createdAt: new Date().toISOString(),
  };
  getDb().socialPosts.enqueue(post);
  return NextResponse.json({ ok: true, post, live: liveRequested, providerResult }, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const removed = getDb().socialPosts.remove(id);
  return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'post not found' }, { status: 404 });
}
