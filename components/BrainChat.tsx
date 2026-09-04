'use client';

import { Fragment, FormEvent, useEffect, useState } from 'react';

type Message = { id?: string; role: 'user' | 'assistant'; content: string; routedTo?: string | null };
type Chat = { id: string; title: string; status: 'active' | 'archived'; createdAt: string; updatedAt: string };

const ACTIVE_CHAT_KEY = 'founder-os.gbrain.active-chat';

function MessageBody({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/).filter(Boolean);

  return <div className="mt-2 min-w-0 space-y-3 break-words text-[15px] leading-7 text-os-text">
    {blocks.map((block, blockIndex) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const isBulletList = lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line));
      const isNumberedList = lines.length > 0 && lines.every((line) => /^\d+[.)]\s+/.test(line));

      if (isBulletList || isNumberedList) {
        const List = isBulletList ? 'ul' : 'ol';
        return <List key={blockIndex} className={`${isBulletList ? 'list-disc' : 'list-decimal'} space-y-1 pl-6 marker:text-os-accent`}>
          {lines.map((line, lineIndex) => <li key={`${blockIndex}-${lineIndex}`} className="pl-1">{line.replace(isBulletList ? /^[-*•]\s+/ : /^\d+[.)]\s+/, '')}</li>)}
        </List>;
      }

      const heading = lines.length === 1 ? lines[0].match(/^#{1,3}\s+(.+)$/) : null;
      if (heading) return <h3 key={blockIndex} className="font-semibold tracking-wide text-os-text">{heading[1]}</h3>;

      return <p key={blockIndex}>
        {lines.map((line, lineIndex) => <Fragment key={`${blockIndex}-${lineIndex}`}>{lineIndex > 0 && <br />}{line}</Fragment>)}
      </p>;
    })}
  </div>;
}

export function BrainChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');

  function rememberChat(id: string) {
    setActiveChatId(id);
    window.localStorage.setItem(ACTIVE_CHAT_KEY, id);
  }

  async function load(preferredId?: string) {
    setLoading(true);
    setError('');
    try {
      const query = preferredId ? `?chatId=${encodeURIComponent(preferredId)}` : '';
      const response = await fetch(`/api/brain/chats${query}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load chat history.');
      setChats(body.chats ?? []);
      rememberChat(body.activeChatId);
      setMessages(body.messages ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load chat history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let preferred: string | undefined;
    try { preferred = window.localStorage.getItem(ACTIVE_CHAT_KEY) ?? undefined; } catch { /* storage can be disabled */ }
    void load(preferred);
  }, []);

  async function createChat() {
    setError('');
    try {
      const response = await fetch('/api/brain/chats', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create' }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not start a new chat.');
      setChats(body.chats ?? []);
      rememberChat(body.created.id);
      setMessages([]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not start a new chat.');
    }
  }

  async function selectChat(id: string) {
    const selected = chats.find((chat) => chat.id === id);
    if (!selected || selected.status !== 'active' || id === activeChatId) return;
    await load(id);
  }

  async function updateChat(action: 'clear' | 'archive' | 'unarchive', id = activeChatId) {
    if (!id) return;
    if (action === 'clear' && !window.confirm('Clear the messages in this chat? The chat itself will remain.')) return;
    if (action === 'archive' && !window.confirm('Archive this chat? You can restore it later.')) return;
    setError('');
    try {
      const response = await fetch('/api/brain/chats', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, chatId: id }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? `Could not ${action} this chat.`);
      setChats(body.chats ?? []);
      rememberChat(body.activeChatId);
      setMessages(body.messages ?? []);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : `Could not ${action} this chat.`);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy || !activeChatId) return;
    setInput('');
    setError('');
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const response = await fetch('/api/agents/conductor/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, chatId: activeChatId, context: 'G-Brain shared memory and agent command center' }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'The brain did not return a response.');
      setMessages(body.brainMessages ?? [
        { role: 'user', content: message },
        { role: 'assistant', content: body.reply ?? 'The brain did not return a response.', routedTo: body.routedTo },
      ]);
      setChats((current) => current.map((chat) => chat.id === activeChatId && chat.title === 'New chat'
        ? { ...chat, title: message.replace(/\s+/g, ' ').slice(0, 64) || 'New chat', updatedAt: new Date().toISOString() }
        : chat));
    } catch (sendError) {
      setMessages((current) => [...current, { role: 'assistant', content: `Connection error: ${sendError instanceof Error ? sendError.message : 'request failed'}` }]);
    } finally {
      setBusy(false);
    }
  }

  const activeChats = chats.filter((chat) => chat.status === 'active');
  const archivedChats = chats.filter((chat) => chat.status === 'archived');
  const activeChat = chats.find((chat) => chat.id === activeChatId);

  return <section className="border border-os-line bg-os-panel p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><div className="os-kicker">CONVERSE WITH THE BRAIN</div><h2 className="mt-1 text-xl text-os-text">Ask G-Brain</h2><p className="mt-1 text-sm leading-6 text-os-dim">Your conversations are saved automatically and remain available when you refresh or change pages.</p></div>
      <span className="font-mono text-[11px] text-os-dim">CONDUCTOR · MEMORY GROUNDED</span>
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-2 border-y border-os-line py-3">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-os-dim">Chat history</span>
      {activeChats.map((chat) => <button key={chat.id} type="button" onClick={() => void selectChat(chat.id)} className={`max-w-[15rem] truncate rounded-sm-t border px-3 py-1.5 text-left text-xs ${chat.id === activeChatId ? 'border-os-accent text-os-accent' : 'border-os-line text-os-dim hover:border-os-accent/60'}`} title={chat.title}>{chat.title}</button>)}
      {!activeChats.length && <span className="text-xs text-os-dim">No active chats</span>}
      <button type="button" onClick={() => void createChat()} className="ml-auto border border-os-accent px-3 py-1.5 font-mono text-[10px] uppercase text-os-accent">New chat</button>
      {activeChat && <>
        <button type="button" onClick={() => void updateChat('clear')} disabled={loading || busy} className="border border-os-line px-3 py-1.5 font-mono text-[10px] uppercase text-os-dim disabled:opacity-40">Clear chat</button>
        <button type="button" onClick={() => void updateChat('archive')} disabled={loading || busy} className="border border-os-line px-3 py-1.5 font-mono text-[10px] uppercase text-os-dim disabled:opacity-40">Archive</button>
      </>}
      {archivedChats.length > 0 && <button type="button" onClick={() => setShowArchived((value) => !value)} className="border border-os-line px-3 py-1.5 font-mono text-[10px] uppercase text-os-dim">{showArchived ? 'Hide archived' : `Archived (${archivedChats.length})`}</button>}
    </div>

    {showArchived && <div className="mb-4 flex flex-wrap gap-2 rounded-sm-t border border-os-line bg-os-bg/30 p-3">
      {archivedChats.map((chat) => <button key={chat.id} type="button" onClick={() => void updateChat('unarchive', chat.id)} className="max-w-[15rem] truncate border border-os-line px-3 py-1.5 text-left text-xs text-os-dim hover:border-os-accent/60" title="Restore this archived chat">{chat.title} <span className="ml-1 font-mono text-[9px] uppercase text-os-accent">restore</span></button>)}
    </div>}

    <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
      {loading && <p className="rounded-sm-t border border-os-line bg-os-bg/40 px-4 py-3 text-sm leading-6 text-os-dim">Loading saved conversations…</p>}
      {!loading && !messages.length && <p className="rounded-sm-t border border-os-line bg-os-bg/40 px-4 py-3 text-sm leading-6 text-os-dim">Ask about your agents, memory, campaigns, or connected tools. This chat will be saved automatically.</p>}
      {messages.map((item, index) => <div key={item.id ?? `${item.role}-${index}`} className={`rounded-sm-t border px-4 py-3 ${item.role === 'user' ? 'border-os-line bg-os-bg/40' : 'border-os-accent/30 bg-os-accent/5'}`}>
        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${item.role === 'user' ? 'text-os-dim' : 'text-os-accent'}`}>{item.role === 'user' ? 'You' : 'G-Brain'}{item.routedTo && <span className="ml-3 text-os-dim">routed to {item.routedTo}</span>}</div>
        {item.role === 'user' ? <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7 text-os-dim">{item.content}</p> : <MessageBody content={item.content} />}
      </div>)}
    </div>
    {error && <p className="mb-3 border border-os-err/40 bg-os-err/5 px-3 py-2 text-sm text-os-err">{error}</p>}
    <form onSubmit={send} className="flex gap-2">
      <input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy || loading || !activeChatId} placeholder="Ask anything about the business…" className="min-w-0 flex-1 border border-os-line bg-os-bg px-3 py-2 text-sm text-os-text outline-none focus:border-os-accent disabled:opacity-60" />
      <button type="submit" disabled={busy || loading || !input.trim() || !activeChatId} className="border border-os-accent px-4 py-2 text-sm text-os-accent disabled:opacity-40">{busy ? 'THINKING…' : 'SEND'}</button>
    </form>
  </section>;
}
