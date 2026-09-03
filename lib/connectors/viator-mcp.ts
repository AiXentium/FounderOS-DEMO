const VIATOR_MCP_URL = process.env.VIATOR_MCP_URL ?? 'https://exp-app-mcp.prod.ep.viator.com/mcp';

type McpResponse = { result?: { content?: Array<{ type?: string; text?: string }> }; error?: { message?: string } };

async function call(method: string, params: Record<string, unknown> = {}): Promise<McpResponse> {
  const response = await fetch(VIATOR_MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await response.json()) as McpResponse;
  if (!response.ok || body.error) throw new Error(body.error?.message ?? `Viator MCP returned ${response.status}`);
  return body;
}

export async function searchViatorMcp(searchTerm: string) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const response = await call('tools/call', {
    name: 'search_experiences',
    arguments: {
      searchTerm: searchTerm || 'travel experiences',
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      limit: 10,
    },
  });
  const text = response.result?.content?.find((item) => item.type === 'text')?.text ?? '{}';
  let parsed: { experiences?: Array<Record<string, unknown>> };
  try {
    parsed = JSON.parse(text) as { experiences?: Array<Record<string, unknown>> };
  } catch {
    throw new Error(text.slice(0, 240));
  }
  return (parsed.experiences ?? []).map((experience) => {
    const code = String(experience.code ?? '');
    const url = String(experience.clickOffToLander ?? `https://www.viator.com/tours/-/${code}`);
    const image = experience.imageUrl ?? experience.image ?? (Array.isArray(experience.images) ? (experience.images[0] as Record<string, unknown> | undefined)?.url : undefined);
    return {
      id: `viator-mcp-${code}`,
      name: String(experience.title ?? 'Viator experience'),
      source: 'Viator',
      url,
      trackedUrl: `${url}${url.includes('?') ? '&' : '?'}utm_source=business-os&utm_medium=affiliate`,
      imageUrl: typeof image === 'string' ? image : undefined,
      price: experience.fromPrice ? `$${experience.fromPrice}` : undefined,
      commission: 'Viator partner rate',
      status: 'live',
    };
  });
}
