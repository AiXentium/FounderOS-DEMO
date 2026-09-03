import { NextResponse } from 'next/server';
import { callRoyalTool } from '@/lib/royal-mcp';

export async function GET(request: Request) {
  try {
    const postId = Number(new URL(request.url).searchParams.get('postId'));
    if (!Number.isInteger(postId) || postId < 1) return NextResponse.json({ success: false, error: 'A valid postId is required' }, { status: 400 });
    const result = await callRoyalTool('elementor_get_page_outline', { post_id: postId });
    return NextResponse.json({ success: true, postId, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Elementor outline unavailable' }, { status: 502 });
  }
}
