import { serveRelease } from '@/lib/website-release-view';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ path?: string[] }> }) { return serveRelease('preview', (await context.params).path); }
