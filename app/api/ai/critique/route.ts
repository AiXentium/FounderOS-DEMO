import { NextResponse } from 'next/server';
import { critiquePage } from '@/lib/ai-studio';
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ mode: 'demo', critique: critiquePage(typeof body.title === 'string' ? body.title : '') });
}
