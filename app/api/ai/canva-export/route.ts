import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ format: 'canva-ready', design: { title: body.title ?? '', direction: body.direction ?? 'editorial', copy: body.copy ?? '', note: 'Import this structured brief into Canva or use it as a handoff to a Canva design.' } });
}
