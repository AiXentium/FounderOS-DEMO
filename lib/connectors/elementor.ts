import type { ConnectorStatus } from '@/lib/connectors/types';
import { ElementorClient } from '@/lib/elementor-client';

const TTL_MS = 60_000;

let cache: { at: number; status: ConnectorStatus } | null = null;

function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export async function elementorStatus(
  env: Record<string, string | undefined> = process.env,
): Promise<ConnectorStatus> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.status;

  const url = env.WORDPRESS_URL;
  const username = env.WORDPRESS_USERNAME;
  const appPassword = env.WORDPRESS_APP_PASSWORD;

  if (!url || !username || !appPassword) {
    const status: ConnectorStatus = {
      id: 'elementor',
      name: 'Elementor',
      kind: 'cms',
      state: 'not_configured',
      detail: 'WordPress connection required - configure WORDPRESS_* environment variables',
    };
    cache = { at: now, status };
    return status;
  }

  try {
    const baseUrl = normalizeUrl(url);
    const client = new ElementorClient({
      baseUrl,
      username,
      appPassword,
    });

    const isAvailable = await client.isElementorAvailable();
    if (!isAvailable) {
      const status: ConnectorStatus = {
        id: 'elementor',
        name: 'Elementor',
        kind: 'cms',
        state: 'error',
        detail: 'Elementor plugin is not installed or not activated on this WordPress site',
      };
      cache = { at: now, status };
      return status;
    }

    const version = await client.getElementorVersion();

    let bridge;
    try {
      bridge = await client.getBridgeHealth();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const status: ConnectorStatus = {
        id: 'elementor',
        name: 'Elementor',
        kind: 'cms',
        state: 'error',
        detail: `Elementor ${version || 'unknown'} is available, but the Business OS Elementor Bridge is not ready: ${detail}`,
        meta: { siteUrl: baseUrl, version: version ? 1 : 0, bridge: 0 },
      };
      cache = { at: now, status };
      return status;
    }

    const status: ConnectorStatus = {
      id: 'elementor',
      name: 'Elementor',
      kind: 'cms',
      state: 'connected',
      detail: `Elementor ${version || 'unknown version'} + Business OS Bridge ${bridge.version} detected and ready`,
      meta: {
        siteUrl: baseUrl,
        version: version ? 1 : 0,
        bridge: 1,
      },
    };
    cache = { at: now, status };
    return status;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const status: ConnectorStatus = {
      id: 'elementor',
      name: 'Elementor',
      kind: 'cms',
      state: 'error',
      detail: `Connection failed: ${detail}`,
    };
    cache = { at: now, status };
    return status;
  }
}
