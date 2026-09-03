import type { ConnectorStatus } from '@/lib/connectors/types';

const TTL_MS = 60_000;

export interface WordPressConfig {
  siteId: string;
  siteName: string;
  siteUrl: string;
  username: string;
  appPassword: string;
  enabled: boolean;
}

export interface WordPressSiteStatus {
  siteId: string;
  siteName: string;
  siteUrl: string;
  status: 'connected' | 'auth_failed' | 'unreachable' | 'api_unavailable' | 'insufficient_permission';
  wordpressVersion?: string;
  restApiAvailable: boolean;
  abilitiesAvailable: boolean;
  woocommerceAvailable: boolean;
  lastCheckedAt: number;
  userId?: number;
  userName?: string;
  errorDetail?: string;
}

let cache: { at: number; status: ConnectorStatus } | null = null;

function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function createAuthHeader(username: string, appPassword: string): string {
  const credentials = `${username}:${appPassword}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function checkWordPressEndpoint(baseUrl: string): Promise<{ available: boolean; version?: string }> {
  try {
    const response = await fetch(`${baseUrl}/wp-json/`, {
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });
    if (!response.ok) return { available: false };
    const data = await response.json() as Record<string, unknown>;
    return { available: true, version: data.namespaces ? 'available' : undefined };
  } catch {
    return { available: false };
  }
}

async function checkAbilitiesApi(baseUrl: string, authHeader: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/wp-json/wp-abilities/v1/abilities`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function checkWooCommerce(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/products`, {
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });
    return response.status === 200 || response.status === 401;
  } catch {
    return false;
  }
}

export async function wordPressStatus(
  env: Record<string, string | undefined> = process.env,
): Promise<ConnectorStatus> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.status;

  const url = env.WORDPRESS_URL;
  const username = env.WORDPRESS_USERNAME;
  const appPassword = env.WORDPRESS_APP_PASSWORD;

  if (!url || !username || !appPassword) {
    const status: ConnectorStatus = {
      id: 'wordpress',
      name: 'WordPress',
      kind: 'cms',
      state: 'not_configured',
      detail: 'Missing WORDPRESS_URL, WORDPRESS_USERNAME, or WORDPRESS_APP_PASSWORD',
    };
    cache = { at: now, status };
    return status;
  }

  const baseUrl = normalizeUrl(url);

  try {
    const endpoint = await checkWordPressEndpoint(baseUrl);
    if (!endpoint.available) {
      const status: ConnectorStatus = {
        id: 'wordpress',
        name: 'WordPress',
        kind: 'cms',
        state: 'error',
        detail: 'WordPress site unreachable or REST API not available',
      };
      cache = { at: now, status };
      return status;
    }

    const authHeader = createAuthHeader(username, appPassword);
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });

    if (response.status === 401) {
      const status: ConnectorStatus = {
        id: 'wordpress',
        name: 'WordPress',
        kind: 'cms',
        state: 'error',
        detail: 'Authentication failed - verify username and application password',
      };
      cache = { at: now, status };
      return status;
    }

    if (response.status === 403) {
      const status: ConnectorStatus = {
        id: 'wordpress',
        name: 'WordPress',
        kind: 'cms',
        state: 'error',
        detail: 'Insufficient permissions - user lacks required access',
      };
      cache = { at: now, status };
      return status;
    }

    if (!response.ok) {
      const status: ConnectorStatus = {
        id: 'wordpress',
        name: 'WordPress',
        kind: 'cms',
        state: 'error',
        detail: `WordPress API error (HTTP ${response.status})`,
      };
      cache = { at: now, status };
      return status;
    }

    const data = await response.json() as Record<string, unknown>;

    const [abilitiesAvailable, woocommerceAvailable] = await Promise.all([
      checkAbilitiesApi(baseUrl, authHeader),
      checkWooCommerce(baseUrl),
    ]);

    const status: ConnectorStatus = {
      id: 'wordpress',
      name: 'WordPress',
      kind: 'cms',
      state: 'connected',
      detail: `Connected as ${(data.name as string) || username}`,
      meta: {
        siteUrl: baseUrl,
        userId: (data.id as number) || 0,
        abilitiesAvailable: abilitiesAvailable ? 1 : 0,
        woocommerceAvailable: woocommerceAvailable ? 1 : 0,
      },
    };
    cache = { at: now, status };
    return status;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const detail = message.includes('timeout')
      ? 'Connection timeout - site may be slow or unavailable'
      : message.includes('ERR_')
        ? 'Network error - unable to reach site'
        : 'Connection failed - check site URL and network';

    const status: ConnectorStatus = {
      id: 'wordpress',
      name: 'WordPress',
      kind: 'cms',
      state: 'error',
      detail,
    };
    cache = { at: now, status };
    return status;
  }
}
