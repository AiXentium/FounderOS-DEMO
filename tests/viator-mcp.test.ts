import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchViatorMcp } from '@/lib/connectors/viator-mcp';

describe('Viator MCP connector', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends a session UUID and preserves the exact tracked click-off URL', async () => {
    const trackedUrl = 'https://www.viator.com/tours/Venice/example/d522-123?mcid=partner';
    const mockedFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      result: { content: [{ type: 'text', text: JSON.stringify({ experiences: [{ code: '123', title: 'Venice Canal Tour', clickOffToLander: trackedUrl }] }) }] },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const results = await searchViatorMcp('Venice tours');
    const request = JSON.parse(String(mockedFetch.mock.calls[0]?.[1]?.body));
    expect(request.params.arguments.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(results[0].trackedUrl).toBe(trackedUrl);
    expect(results[0].trackedUrl).not.toContain('utm_');
  });

  it('drops results that do not include a tracked click-off URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      result: { content: [{ type: 'text', text: JSON.stringify({ experiences: [{ code: '123', title: 'Venice Canal Tour' }] }) }] },
    }), { status: 200 }));
    await expect(searchViatorMcp('Venice tours')).resolves.toEqual([]);
  });
});
