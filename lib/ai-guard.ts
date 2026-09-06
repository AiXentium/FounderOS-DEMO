type Bucket = { startedAt: number; count: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 30;

function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'local';
}

/** Small process-local guard against accidental AI request loops and spend spikes. */
export function consumeAiBudget(request: Request, limit = DEFAULT_LIMIT): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const key = clientKey(request);
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}
