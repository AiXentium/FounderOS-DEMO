import { emailStatus } from '@/lib/connectors/email';
import { calendarStatus } from '@/lib/connectors/gcal';
import { slackStatus } from '@/lib/connectors/slack';
import { wordPressStatus } from '@/lib/connectors/wordpress';
import { elementorStatus } from '@/lib/connectors/elementor';
import { paymentsStatus } from '@/lib/connectors/payments';
import { notionStatus } from '@/lib/connectors/notion';
import { zernioStatus } from '@/lib/connectors/zernio';
import { beehiivStatus } from '@/lib/connectors/beehiiv';
import { manychatStatus } from '@/lib/connectors/manychat';
import { attioStatus } from '@/lib/connectors/attio';
import { arcadsStatus } from '@/lib/connectors/arcads';
import { miroStatus } from '@/lib/connectors/miro';
import { wisprStatus } from '@/lib/connectors/wispr';
import { whatsappStatus } from '@/lib/connectors/whatsapp';
import { obsidianStatus } from '@/lib/connectors/obsidian';
import { localStackStatus } from '@/lib/connectors/local-stack';
import { llmStatus } from '@/lib/connectors/llm';
import { webinarjamStatus } from '@/lib/connectors/webinarjam';
import { trakyoStatus } from '@/lib/connectors/trakyo';
import { metaAdsStatus } from '@/lib/connectors/meta-ads';
import { ghlStatus } from '@/lib/connectors/ghl';
import { viatorStatus } from '@/lib/connectors/viator';
import { openPageGeminiStatus } from '@/lib/openpage-gemini';
import { getBrainProvider } from '@/lib/brain';
import { resolveManychatKey, runtimeEnv } from '@/lib/creds';
import type { ConnectorStatus } from '@/lib/connectors/types';

async function brainConnectorStatus(): Promise<ConnectorStatus> {
  const status = await getBrainProvider().status();
  return {
    id: 'gbrain',
    name: 'G-Brain',
    kind: 'brain',
    state: status.connected ? 'connected' : 'error',
    detail: status.detail,
    meta: { provider: status.provider },
  };
}

function royalMcpStatus(): ConnectorStatus {
  const env = runtimeEnv();
  const configured = Boolean(env.ROYAL_MCP_URL && env.ROYAL_MCP_API_KEY);
  return {
    id: 'royal-mcp',
    name: 'Royal MCP',
    kind: 'cms',
    state: configured ? 'connected' : 'not_configured',
    detail: configured ? 'Royal MCP credentials are configured.' : 'ROYAL_MCP_URL and ROYAL_MCP_API_KEY are required.',
  };
}

function googleOAuthStatus(): ConnectorStatus {
  const env = runtimeEnv();
  const connected = Boolean(env.GOOGLE_REFRESH_TOKEN);
  return { id: 'google-oauth', name: 'Google', kind: 'calendar', state: connected ? 'connected' : 'not_configured', detail: connected ? 'One Google account authorized for Gmail, Calendar, Sheets, Docs, and Drive.' : 'Authorize one Google account to connect Google services.' };
}

function geminiStatus(): ConnectorStatus {
  const status = openPageGeminiStatus();
  return {
    id: 'gemini',
    name: 'Gemini / Google AI Studio',
    kind: 'orchestration',
    state: status.configured ? 'connected' : 'not_configured',
    detail: status.configured ? `Gemini is live for OpenPage generation (${status.model}).` : 'Set GEMINI_API_KEY to enable Gemini generation.',
    meta: { provider: status.provider, model: status.model },
  };
}

const CHECKS: [string, ConnectorStatus['kind'], () => Promise<ConnectorStatus>][] = [
  ['gbrain', 'brain', brainConnectorStatus],
  ['llm', 'orchestration', llmStatus],
  ['gemini', 'orchestration', async () => geminiStatus()],
  ['royal-mcp', 'cms', async () => royalMcpStatus()],
  ['google-oauth', 'calendar', async () => googleOAuthStatus()],
  ['whatsapp', 'social', whatsappStatus],
  ['zernio', 'social', zernioStatus],
  ['beehiiv', 'social', () => beehiivStatus(runtimeEnv())],
  [
    'manychat',
    'social',
    () => {
      // Alex's real key rides in ~/.config/mcp.json (the manychat MCP
      // registration), same reuse pattern as Attio — .env.local still wins.
      const env = runtimeEnv();
      if (!env.MANYCHAT_API_KEY) env.MANYCHAT_API_KEY = resolveManychatKey();
      return manychatStatus(env);
    },
  ],
  ['attio', 'crm', attioStatus],
  ['webinarjam', 'crm', webinarjamStatus],
  ['trakyo', 'crm', trakyoStatus],
  ['meta-ads', 'ads', metaAdsStatus],
  ['ghl', 'crm', ghlStatus],
  ['viator', 'affiliate', async () => { const status = viatorStatus(runtimeEnv()); return { id: 'viator', name: 'Viator', kind: 'affiliate', state: status.state === 'connected' ? 'connected' : 'not_configured', detail: status.detail }; }],
  ['arcads', 'creative', arcadsStatus],
  ['wispr', 'local', wisprStatus],
  ['local-stack', 'local', localStackStatus],
  ['obsidian', 'knowledge', obsidianStatus],
  ['miro', 'creative', miroStatus],
  ['wordpress', 'cms', () => wordPressStatus(runtimeEnv())],
  ['elementor', 'cms', () => elementorStatus(runtimeEnv())],
  ['email', 'email', () => emailStatus(runtimeEnv())],
  ['calendar', 'calendar', calendarStatus],
  ['slack', 'slack', () => slackStatus(runtimeEnv())],
  ['payments', 'payments', () => paymentsStatus(runtimeEnv())],
  ['notion', 'notion', () => notionStatus(runtimeEnv())],
];

export async function allConnectorStatuses(): Promise<ConnectorStatus[]> {
  return Promise.all(
    CHECKS.map(([id, kind, check]) =>
      check().catch(
        (err): ConnectorStatus => ({
          id,
          name: id,
          kind,
          state: 'error',
          detail: err instanceof Error ? err.message : String(err),
        }),
      ),
    ),
  );
}
