'use client';

import { Fragment, FormEvent, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const response = await fetch('/api/agents/conductor/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, context: 'G-Brain shared memory and agent command center' }),
      });
      const body = await response.json();
      setMessages((current) => [...current, {
        role: 'assistant',
        content: body.reply ? `${body.routedTo ? `Routed to ${body.routedTo}. ` : ''}${body.reply}` : `Error: ${body.error ?? 'The brain did not return a response.'}`,
      }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: `Connection error: ${error instanceof Error ? error.message : 'request failed'}` }]);
    } finally { setBusy(false); }
  }

  return <section className="border border-os-line bg-os-panel p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div><div className="os-kicker">CONVERSE WITH THE BRAIN</div><h2 className="mt-1 text-xl text-os-text">Ask G-Brain</h2></div>
      <span className="font-mono text-[11px] text-os-dim">CONDUCTOR · MEMORY GROUNDED</span>
    </div>
    <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
      {!messages.length && <p className="rounded-sm-t border border-os-line bg-os-bg/40 px-4 py-3 text-sm leading-6 text-os-dim">Ask about your agents, memory, campaigns, or connected tools.</p>}
      {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`rounded-sm-t border px-4 py-3 ${item.role === 'user' ? 'border-os-line bg-os-bg/40' : 'border-os-accent/30 bg-os-accent/5'}`}>
        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${item.role === 'user' ? 'text-os-dim' : 'text-os-accent'}`}>{item.role === 'user' ? 'You' : 'G-Brain'}</div>
        {item.role === 'user' ? <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7 text-os-dim">{item.content}</p> : <MessageBody content={item.content} />}
      </div>)}
    </div>
    <form onSubmit={send} className="flex gap-2">
      <input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="Ask anything about the business…" className="min-w-0 flex-1 border border-os-line bg-os-bg px-3 py-2 text-sm text-os-text outline-none focus:border-os-accent" />
      <button type="submit" disabled={busy || !input.trim()} className="border border-os-accent px-4 py-2 text-sm text-os-accent disabled:opacity-40">{busy ? 'THINKING…' : 'SEND'}</button>
    </form>
  </section>;
}
