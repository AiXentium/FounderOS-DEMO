const ROYAL_URL = process.env.ROYAL_MCP_URL;
const ROYAL_KEY = process.env.ROYAL_MCP_API_KEY;

export async function royalMcpRequest<T>(method: string, params: Record<string, unknown> = {}) {
  if (!ROYAL_URL || !ROYAL_KEY) throw new Error('Royal MCP is not configured');
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'X-Royal-MCP-API-Key': ROYAL_KEY };
  const initialize = await fetch(ROYAL_URL, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'business-os', version: '1.0.0' } } }) });
  if (!initialize.ok) throw new Error(`Royal MCP initialize failed (${initialize.status})`);
  const session = initialize.headers.get('mcp-session-id');
  if (!session) throw new Error('Royal MCP did not return a session');
  const response = await fetch(ROYAL_URL, { method: 'POST', headers: { ...headers, 'Mcp-Session-Id': session }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method, params }) });
  const body = await response.json() as { result?: T; error?: { message?: string } };
  if (!response.ok || body.error) throw new Error(body.error?.message || `Royal MCP request failed (${response.status})`);
  return body.result as T;
}

export async function callRoyalTool(name: string, arguments_: Record<string, unknown> = {}) {
  return royalMcpRequest<{ content?: unknown[]; isError?: boolean }>('tools/call', { name, arguments: arguments_ });
}
