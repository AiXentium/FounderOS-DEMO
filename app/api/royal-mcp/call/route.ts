import { NextResponse } from 'next/server';
import { callRoyalTool } from '@/lib/royal-mcp';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; arguments?: Record<string, unknown> };
    if (!body.name || !/^(wp|elementor)_[a-z0-9_]+$/.test(body.name)) return NextResponse.json({ success: false, error: 'A valid WordPress or Elementor tool name is required' }, { status: 400 });
    const result = await callRoyalTool(body.name, body.arguments || {});
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Royal MCP tool call failed' }, { status: 502 });
  }
}
