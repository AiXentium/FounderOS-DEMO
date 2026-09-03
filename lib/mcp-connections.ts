import type { ConnectorStatus } from '@/lib/connectors/types';

export type McpConnection = {
  id: string;
  name: string;
  description: string;
  envKeys: string[];
  connectorId?: string;
  defaultUrl?: string;
  note: string;
};

export const MCP_CONNECTIONS: McpConnection[] = [
  {
    id: 'royal-mcp',
    name: 'Royal MCP',
    description: 'WordPress, Elementor, content, and site operations',
    envKeys: ['ROYAL_MCP_URL', 'ROYAL_MCP_API_KEY'],
    connectorId: 'royal-mcp',
    note: 'Read access is automatic; publishing and destructive actions remain approval-gated.',
  },
  {
    id: 'viator-mcp',
    name: 'Viator MCP',
    description: 'Live travel product discovery for Affiliate Studio',
    envKeys: ['VIATOR_MCP_URL'],
    connectorId: 'viator',
    defaultUrl: 'https://exp-app-mcp.prod.ep.viator.com/mcp',
    note: 'The official endpoint can be used without pasting a secret into the UI.',
  },
  {
    id: 'zernio',
    name: 'Zernio Social API',
    description: 'Instagram and Facebook publishing and account sync',
    envKeys: ['ZERNIO_API_KEY'],
    connectorId: 'zernio',
    note: 'This is API-backed rather than MCP, but is included here so agents use one connection hub.',
  },
];

export function mcpConnectionState(item: McpConnection, statuses: ConnectorStatus[], env: Record<string, string>) {
  const status = statuses.find((entry) => entry.id === item.connectorId);
  return {
    connected: status?.state === 'connected',
    keySaved: item.envKeys.every((key) => Boolean(env[key]) || (key === 'VIATOR_MCP_URL' && Boolean(item.defaultUrl))),
    detail: status?.detail,
  };
}
