import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function createChat() {
  const now = new Date().toISOString();
  return { id: randomUUID(), title: 'New chat', status: 'active' as const, createdAt: now, updatedAt: now };
}

function state(preferredId?: string) {
  const db = getDb();
  let chats = db.brainChats.all(true);
  if (!chats.length) {
    const chat = createChat();
    db.brainChats.insert(chat);
    chats = [chat];
  }
  const preferred = preferredId ? chats.find((chat) => chat.id === preferredId && chat.status === 'active') : undefined;
  const active = preferred ?? chats.find((chat) => chat.status === 'active');
  if (!active) {
    const chat = createChat();
    db.brainChats.insert(chat);
    chats = [chat, ...chats];
    return { chats, activeChatId: chat.id, messages: [] };
  }
  return { chats, activeChatId: active.id, messages: db.brainChats.messages(active.id) };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(state(url.searchParams.get('chatId') ?? undefined));
}

export async function POST(request: Request) {
  let body: { action?: unknown; chatId?: unknown } = {};
  try { body = await request.json(); } catch { /* empty body means create */ }

  const db = getDb();
  const action = typeof body.action === 'string' ? body.action : 'create';
  const chatId = typeof body.chatId === 'string' ? body.chatId : undefined;
  const chat = chatId ? db.brainChats.byId(chatId) : null;
  const now = new Date().toISOString();

  if ((action === 'clear' || action === 'archive' || action === 'unarchive') && !chat) {
    return NextResponse.json({ error: 'brain chat not found' }, { status: 404 });
  }
  if (action === 'clear' && chat) db.brainChats.clearMessages(chat.id, now);
  else if (action === 'archive' && chat) db.brainChats.archive(chat.id, now);
  else if (action === 'unarchive' && chat) db.brainChats.unarchive(chat.id, now);
  else if (action !== 'create') return NextResponse.json({ error: 'unsupported chat action' }, { status: 400 });

  if (action === 'create') {
    const fresh = createChat();
    db.brainChats.insert(fresh);
    return NextResponse.json({ ...state(fresh.id), created: fresh });
  }
  return NextResponse.json(state(action === 'archive' ? undefined : chatId));
}
