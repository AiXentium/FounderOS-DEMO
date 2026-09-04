'use client';

import { FormEvent, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

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

  return <section className="border border-os-line bg-os-panel p-4">
    <div className="mb-3 flex items-center justify-between">
      <div><div className="os-kicker">CONVERSE WITH THE BRAIN</div><h2 className="mt-1 text-xl text-os-text">Ask G-Brain</h2></div>
      <span className="font-mono text-[11px] text-os-dim">CONDUCTOR · MEMORY GROUNDED</span>
    </div>
    <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
      {!messages.length && <p className="text-sm text-os-dim">Ask about your agents, memory, campaigns, or connected tools.</p>}
      {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`border-l-2 px-3 py-2 text-sm ${item.role === 'user' ? 'border-os-muted text-os-dim' : 'border-os-accent text-os-text'}`}><span className="mr-2 font-mono text-[10px] uppercase">{item.role}</span>{item.content}</div>)}
    </div>
    <form onSubmit={send} className="flex gap-2">
      <input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="Ask anything about the business…" className="min-w-0 flex-1 border border-os-line bg-os-bg px-3 py-2 text-sm text-os-text outline-none focus:border-os-accent" />
      <button type="submit" disabled={busy || !input.trim()} className="border border-os-accent px-4 py-2 text-sm text-os-accent disabled:opacity-40">{busy ? 'THINKING…' : 'SEND'}</button>
    </form>
  </section>;
}
