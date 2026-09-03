import { NextResponse } from 'next/server';
import { royalMcpRequest } from '@/lib/royal-mcp';

export async function GET() {
  try {
    const result = await royalMcpRequest<{ tools?: unknown[] }>('tools/list');
    return NextResponse.json({ success: true, connected: true, toolCount: result.tools?.length || 0, tools: result.tools || [] });
  } catch (error) {
    return NextResponse.json({ success: false, connected: false, error: error instanceof Error ? error.message : 'Royal MCP unavailable' }, { status: 502 });
  }
}
