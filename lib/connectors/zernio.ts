import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { CRED_FILES, resolveCred } from '@/lib/creds';
import type { ConnectorStatus } from '@/lib/connectors/types';

const CONFIG_PATH = path.join(os.homedir(), '.config/social', 'config.json');

type ZernioConfig = {
  baseUrl?: string;
  v1Url?: string;
  accounts?: Record<string, { handle?: string; followers?: number }>;
};

function readConfig(): ZernioConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/** Account map from ~/.config/social/config.json — handles + follower counts. */
export function zernioAccounts(): Record<string, { handle?: string; followers?: number }> {
  return readConfig().accounts ?? {};
}

export function zernioKey(): string | undefined {
  return resolveCred('ZERNIO_API_KEY', [CRED_FILES.socialMedia, CRED_FILES.agentsEnv]);
}

// ── Live follower counts ────────────────────────────────────────────────────
// The static config.json numbers go stale; the real live counts come back from
// the Zernio/Late `/v1/accounts` payload at metadata.profileData.followersCount
// (with page fan_count as a fallback for Facebook-style accounts).

type FollowerMap = Record<string, { handle?: string; followers?: number }>;

export type ZernioAccount = {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  profileUrl?: string;
  isActive: boolean;
  status?: string;
  profileId?: string;
  followers?: number;
};

type ZernioApiError = { error?: string; code?: string; message?: string };

function apiBaseUrl(): string {
  const config = readConfig();
  // Zernio is the canonical provider. Keep the legacy config override so an
  // existing private gateway can still be used without changing the UI.
  return (config.v1Url ?? 'https://zernio.com/api/v1').replace(/\/$/, '');
}

async function zernioRequest<T>(pathName: string, init: RequestInit = {}): Promise<T> {
  const key = zernioKey();
  if (!key) throw new Error('ZERNIO_API_KEY is not configured');
  const response = await fetch(`${apiBaseUrl()}${pathName}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => ({})) as T & ZernioApiError;
  if (!response.ok) {
    const detail = body.error || body.message || `Zernio API HTTP ${response.status}`;
    const error = new Error(detail) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = body.code;
    throw error;
  }
  return body as T;
}

function accountId(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && typeof (value as { _id?: unknown })._id === 'string') return (value as { _id: string })._id;
  return undefined;
}

function parseAccountDetails(raw: unknown): ZernioAccount[] {
  const accounts = (raw as { accounts?: unknown })?.accounts;
  if (!Array.isArray(accounts)) return [];
  return accounts.flatMap((entry) => {
    const a = (entry ?? {}) as Record<string, unknown>;
    const id = accountId(a._id ?? a.id ?? a.accountId);
    const platform = typeof a.platform === 'string' ? a.platform.toLowerCase() : '';
    if (!id || !platform) return [];
    const metadata = (a.metadata ?? {}) as Record<string, unknown>;
    const profileData = (metadata.profileData ?? {}) as Record<string, unknown>;
    const followerValue = profileData.followersCount ?? metadata.followersCount ?? a.followers;
    return [{
      id,
      platform,
      username: typeof a.username === 'string' ? a.username : undefined,
      displayName: typeof a.displayName === 'string' ? a.displayName : undefined,
      profileUrl: typeof a.profileUrl === 'string' ? a.profileUrl : undefined,
      isActive: a.isActive !== false,
      status: typeof a.status === 'string' ? a.status : undefined,
      profileId: accountId(a.profileId),
      followers: typeof followerValue === 'number' && Number.isFinite(followerValue) ? followerValue : undefined,
    }];
  });
}

let accountDetailsCache: { at: number; data: ZernioAccount[] } | null = null;

/** Connected account records, including the provider account IDs required for
 * real Instagram/Facebook publishing. IDs are never guessed or seeded. */
export async function zernioLiveAccountDetails(force = false): Promise<ZernioAccount[]> {
  const now = Date.now();
  if (!force && accountDetailsCache && now - accountDetailsCache.at < LIVE_TTL_MS) return accountDetailsCache.data;
  try {
    const data = await zernioRequest<{ accounts?: unknown[] }>('/accounts');
    const accounts = parseAccountDetails(data);
    accountDetailsCache = { at: now, data: accounts };
    return accounts;
  } catch {
    return accountDetailsCache?.data ?? [];
  }
}

export type ZernioPublishInput = {
  caption: string;
  platforms: string[];
  mediaUrl?: string | null;
  publishNow?: boolean;
  scheduledFor?: string | null;
  timezone?: string;
};

/** Publish or schedule through Zernio's official unified posts endpoint. The
 * API requires the real connected account ID for each platform, so a missing
 * Instagram/Facebook OAuth account fails with an actionable message. */
export async function publishThroughZernio(input: ZernioPublishInput): Promise<unknown> {
  const requested = [...new Set(input.platforms.map((platform) => platform.toLowerCase()))];
  const accounts = await zernioLiveAccountDetails(true);
  const targets = requested.map((platform) => {
    const account = accounts.find((candidate) => candidate.platform === platform && candidate.isActive && candidate.status !== 'disconnected');
    return { platform, account };
  });
  const missing = targets.filter((target) => !target.account).map((target) => target.platform);
  if (missing.length > 0) {
    throw new Error(`No connected Zernio account for ${missing.join(', ')}. Connect the account with OAuth, then retry.`);
  }

  const body: Record<string, unknown> = {
    content: input.caption,
    platforms: targets.map(({ platform, account }) => ({ platform, accountId: account!.id })),
    timezone: input.timezone ?? 'America/New_York',
    crosspostingEnabled: true,
  };
  if (input.mediaUrl) body.mediaItems = [{ type: 'image', url: input.mediaUrl }];
  if (input.publishNow) body.publishNow = true;
  else if (input.scheduledFor) body.scheduledFor = input.scheduledFor;
  else body.isDraft = true;

  return zernioRequest('/posts', {
    method: 'POST',
    headers: { 'x-request-id': randomUUID() },
    body: JSON.stringify(body),
  });
}

export async function zernioAccountConnectUrl(
  platform: 'instagram' | 'facebook',
  redirectUrl?: string,
): Promise<string> {
  const profiles = await zernioRequest<{ profiles?: Array<{ _id?: string }> }>('/profiles');
  let profileId = profiles.profiles?.find((profile) => typeof profile._id === 'string')?._id;
  if (!profileId) {
    const created = await zernioRequest<{ profile?: { _id?: string } }>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Lets Talk Miles and Travel', description: 'Business OS social publishing profile' }),
    });
    profileId = created.profile?._id;
  }
  if (!profileId) throw new Error('Zernio returned no publishing profile ID');
  const query = new URLSearchParams({ profileId });
  if (redirectUrl) query.set('redirect_url', redirectUrl);
  const response = await zernioRequest<{ authUrl?: string; data?: { authUrl?: string } }>(`/connect/${platform}?${query.toString()}`);
  const authUrl = response.authUrl ?? response.data?.authUrl;
  if (!authUrl) throw new Error(`Zernio returned no ${platform} OAuth URL`);
  return authUrl;
}

function pickFollowers(account: unknown): number | undefined {
  const a = (account ?? {}) as Record<string, any>;
  const md = (a.metadata ?? {}) as Record<string, any>;
  const pages = Array.isArray(md.availablePages) ? md.availablePages : [];
  const candidates = [
    md?.profileData?.followersCount,
    md?.userProfile?.followersCount,
    a?.profileData?.followersCount,
    pages[0]?.fan_count,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c) && c >= 0) return c;
  }
  return undefined;
}

/** Map a `/v1/accounts` payload to the {platform: {handle, followers}} shape the
    snapshot sync consumes. Accounts without a resolvable follower count are
    dropped — never a fake zero. */
export function parseLiveAccounts(raw: unknown): FollowerMap {
  const accounts = (raw as { accounts?: unknown })?.accounts;
  if (!Array.isArray(accounts)) return {};
  const out: FollowerMap = {};
  for (const account of accounts) {
    const a = (account ?? {}) as Record<string, any>;
    const platform = typeof a.platform === 'string' ? a.platform : null;
    if (!platform) continue;
    const followers = pickFollowers(a);
    if (followers == null) continue;
    const username = typeof a.username === 'string' ? a.username : undefined;
    out[platform] = { handle: username ? `@${username}` : undefined, followers };
  }
  return out;
}

let liveAccountsCache: { at: number; data: FollowerMap } | null = null;
const LIVE_TTL_MS = 60_000;

/** Live follower counts straight from Zernio/Late. 60s in-memory cache so rapid
    re-renders don't re-hit the API; 6s timeout; falls back to the last good
    response (or {}) on error so a page render never hangs or blanks out. */
export async function zernioLiveAccounts(): Promise<FollowerMap> {
  const now = Date.now();
  if (liveAccountsCache && now - liveAccountsCache.at < LIVE_TTL_MS) return liveAccountsCache.data;
  const key = zernioKey();
  if (!key) return {};
  const config = readConfig();
  try {
    const res = await fetch(`${config.v1Url ?? 'https://zernio.com/api/v1'}/accounts`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseLiveAccounts(await res.json());
    liveAccountsCache = { at: now, data };
    return data;
  } catch {
    return liveAccountsCache?.data ?? {};
  }
}

// ── Published-post history ──────────────────────────────────────────────────

export type ZernioPost = {
  platform: string;
  caption: string;
  url: string;
  publishedAt: string | null;
  status: string;
};

/** Map a `/history` (or `/v1/posts`) payload to recent published posts. Picks
    the first platform's live post URL. Engagement (likes/views) is intentionally
    absent — that lives behind Late's paid analytics add-on, so we never invent
    it. */
export function parseHistory(raw: unknown, limit = 6): ZernioPost[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { posts?: unknown })?.posts)
      ? ((raw as { posts: unknown[] }).posts)
      : null;
  if (!arr) return [];
  return arr.slice(0, limit).map((entry) => {
    const e = (entry ?? {}) as Record<string, any>;
    const postIds = Array.isArray(e.postIds) ? e.postIds : [];
    const primary = postIds.find((p: any) => p?.postUrl) ?? postIds[0] ?? {};
    const platform =
      (typeof primary.platform === 'string' && primary.platform) ||
      (Array.isArray(e.platforms) && typeof e.platforms[0] === 'string' && e.platforms[0]) ||
      'unknown';
    const caption = typeof e.post === 'string' ? e.post : typeof e.content === 'string' ? e.content : '';
    return {
      platform: String(platform),
      caption,
      url: typeof primary.postUrl === 'string' ? primary.postUrl : '',
      publishedAt: typeof e.created === 'string' ? e.created : typeof e.scheduleDate === 'string' ? e.scheduleDate : null,
      status: typeof e.status === 'string' ? e.status : 'unknown',
    };
  });
}

// ── Posting activity (per-day, per-platform) ────────────────────────────────

export type ZernioPostDay = { date: string; platforms: string[] };

/** Map a `/history` payload to one {date, platforms[]} per post, keeping the
    FULL cross-post platform list (a post sent to IG+TikTok+YT yields all three).
    Powers the posting-consistency chart's per-platform breakdown + hover. */
export function parsePostDays(raw: unknown): ZernioPostDay[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { posts?: unknown })?.posts)
      ? ((raw as { posts: unknown[] }).posts)
      : null;
  if (!arr) return [];
  const out: ZernioPostDay[] = [];
  for (const entry of arr) {
    const e = (entry ?? {}) as Record<string, any>;
    const stamp = typeof e.created === 'string' ? e.created : typeof e.scheduleDate === 'string' ? e.scheduleDate : null;
    const platforms = Array.isArray(e.platforms) ? e.platforms.filter((p: unknown): p is string => typeof p === 'string') : [];
    if (!stamp || platforms.length === 0) continue;
    out.push({ date: stamp.slice(0, 10), platforms });
  }
  return out;
}

let postDaysCache: { at: number; data: ZernioPostDay[] } | null = null;

/** Full real posting history (date + cross-post platforms per post), 60s-cached.
    The endpoint returns the full set (~tens of posts), no pagination. */
export async function zernioPostDays(): Promise<ZernioPostDay[]> {
  const now = Date.now();
  if (postDaysCache && now - postDaysCache.at < LIVE_TTL_MS) return postDaysCache.data;
  const key = zernioKey();
  if (!key) return [];
  const config = readConfig();
  try {
    const res = await fetch(`${config.baseUrl ?? 'https://getlate.dev/api'}/history?limit=200`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parsePostDays(await res.json());
    postDaysCache = { at: now, data };
    return data;
  } catch {
    return postDaysCache?.data ?? [];
  }
}

let livePostsCache: { at: number; data: ZernioPost[] } | null = null;

/** Recent published posts from Zernio/Late, same 60s-cache + timeout discipline
    as the account fetch. */
export async function zernioRecentPosts(limit = 6): Promise<ZernioPost[]> {
  const now = Date.now();
  if (livePostsCache && now - livePostsCache.at < LIVE_TTL_MS) return livePostsCache.data.slice(0, limit);
  const key = zernioKey();
  if (!key) return [];
  const config = readConfig();
  try {
    const res = await fetch(`${config.baseUrl ?? 'https://getlate.dev/api'}/history`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseHistory(await res.json(), 24);
    livePostsCache = { at: now, data };
    return data.slice(0, limit);
  } catch {
    return livePostsCache?.data.slice(0, limit) ?? [];
  }
}

export async function zernioStatus(): Promise<ConnectorStatus> {
  const key = zernioKey();
  if (!key) {
    return {
      id: 'zernio',
      name: 'Zernio (Social)',
      kind: 'social',
      state: 'not_configured',
      detail: 'ZERNIO_API_KEY not found in env, ~/.config/social/.env, or knowledge/.env.agents.',
    };
  }
  try {
    const liveAccounts = await zernioLiveAccountDetails(true);
    if (liveAccounts.length === 0) {
      return {
        id: 'zernio',
        name: 'Zernio (Social)',
        kind: 'social',
        state: 'not_configured',
        detail: 'Zernio API key is valid, but no connected social accounts were returned. Connect Instagram and Facebook with OAuth before publishing.',
        meta: { platforms: 0, followers: 0 },
      };
    }
    const livePlatformCount = new Set(liveAccounts.map((account) => account.platform)).size;
    const liveFollowers = liveAccounts.reduce((sum, account) => sum + (account.followers ?? 0), 0);
    return {
      id: 'zernio',
      name: 'Zernio (Social)',
      kind: 'social',
      state: 'connected',
      detail: `${livePlatformCount} live platform${livePlatformCount === 1 ? '' : 's'} · ${liveFollowers.toLocaleString('en-US')} total followers · publishing ready`,
      meta: { platforms: livePlatformCount, followers: liveFollowers, accounts: liveAccounts.length },
    };
  } catch (err) {
    return {
      id: 'zernio',
      name: 'Zernio (Social)',
      kind: 'social',
      state: 'error',
      detail: `Key found but API check failed: ${err instanceof Error ? err.message : String(err)}`,
      meta: { platforms: accountDetailsCache?.data.length ?? 0 },
    };
  }
}
