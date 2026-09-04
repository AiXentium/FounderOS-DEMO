import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { realAgents } from '@/lib/agents/real';
import { chatWithAgent } from '@/lib/agents/chat';
import { routeConductorMessage } from '@/lib/agents/conductor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // better-sqlite3 is native — keep off the edge runtime

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let message = '';
  let screenContext: string | undefined;
  let brainChatId: string | undefined;
  try {
    const body = (await req.json()) as { message?: unknown; context?: unknown; chatId?: unknown };
    message = typeof body.message === 'string' ? body.message.trim() : '';
    screenContext = typeof body.context === 'string' && body.context.trim() ? body.context.slice(0, 4000) : undefined;
    brainChatId = typeof body.chatId === 'string' && body.chatId.trim() ? body.chatId.trim() : undefined;
  } catch {
    // fall through to the empty-message rejection
  }
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  // Resolve the target up front so a genuinely-unknown agent is a 404, while a
  // downstream failure (gateway error, Zod throw, …) surfaces honestly as a 500
  // instead of masquerading as "unknown agent".
  const isConductor = id === 'conductor';
  if (!isConductor && !realAgents.some((a) => a.id === id)) {
    return NextResponse.json({ error: `unknown agent: ${id}` }, { status: 404 });
  }

  try {
    const db = getDb();
    if (brainChatId) {
      const chat = db.brainChats.byId(brainChatId);
      if (!chat || chat.status !== 'active') {
        return NextResponse.json({ error: 'active brain chat not found' }, { status: 404 });
      }
    }
    const result = isConductor
      ? await routeConductorMessage(db, realAgents, message, { screenContext, brainChatId })
      : { ...(await chatWithAgent(db, realAgents, id, message, { screenContext, brainChatId })), routedTo: id };
    if (brainChatId) {
      const chat = db.brainChats.byId(brainChatId);
      if (!chat || chat.status !== 'active') {
        return NextResponse.json({ error: 'active brain chat not found' }, { status: 404 });
      }
      const createdAt = new Date().toISOString();
      const existingMessages = db.brainChats.messages(brainChatId);
      db.brainChats.insertMessage({ id: randomUUID(), chatId: brainChatId, role: 'user', content: message, routedTo: null, createdAt });
      db.brainChats.insertMessage({ id: randomUUID(), chatId: brainChatId, role: 'assistant', content: result.reply, routedTo: result.routedTo, createdAt: new Date().toISOString() });
      if (existingMessages.length === 0) {
        const title = message.replace(/\s+/g, ' ').slice(0, 64) || 'New chat';
        db.brainChats.rename(brainChatId, title, new Date().toISOString());
      } else {
        db.brainChats.touch(brainChatId, new Date().toISOString());
      }
      return NextResponse.json({ ...result, brainChatId, brainMessages: db.brainChats.messages(brainChatId) });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
