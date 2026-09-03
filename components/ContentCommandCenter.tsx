'use client';

import { useState } from 'react';

export function ContentCommandCenter() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('Ready — commands are routed through G-Brain and Conductor.');
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!message.trim() || busy) return;
    setBusy(true); setStatus('G-Brain is routing this brief to the appropriate agents…');
    try {
      const res = await fetch('/api/agents/broadcast', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) });
      const body = await res.json();
      setStatus(res.ok ? 'Work completed or drafted. Review the resulting runs and approve publishing separately.' : (body.error ?? 'The command could not be completed.'));
    } catch { setStatus('The command could not reach the agent runtime.'); }
    finally { setBusy(false); }
  }
  return <section className="mb-7 rounded-lg-t border border-[var(--accent-line)] bg-os-surface p-4"><div className="font-mono text-[13px] uppercase tracking-[0.16em] text-os-accent">G-Brain command center</div><p className="mt-2 text-[16px] leading-relaxed text-os-dim">Give one brief. Conductor routes it across content, affiliate, website, brand, and social agents using shared context.</p><div className="mt-3 flex gap-2"><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void run(); }} placeholder="Brief the team…" aria-label="G-Brain command" className="min-w-0 flex-1 rounded-sm-t border border-os-border bg-os-surface2 px-3 py-2 text-[16px]" /><button disabled={busy || !message.trim()} onClick={() => void run()} className="rounded-sm-t bg-os-accent px-4 py-2 font-mono text-[14px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-50">{busy ? 'Working…' : 'Run brief'}</button></div><div className="mt-2 text-[14px] text-os-muted">{status}</div><div className="mt-2 text-[14px] text-os-warn">Publishing and external website changes still require your approval.</div></section>;
}
