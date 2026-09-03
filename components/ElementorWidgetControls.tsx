'use client';

import { useState } from 'react';

export function ElementorWidgetControls() {
  const [postId, setPostId] = useState('991');
  const [search, setSearch] = useState('Hi, I\'m Arelys-Nice To Meet You');
  const [replacement, setReplacement] = useState('');
  const [status, setStatus] = useState('Ready for an approved Elementor text change.');
  const replaceText = async () => {
    if (!search || !replacement) return setStatus('Enter both the existing and replacement text.');
    setStatus('Saving approved change to Elementor…');
    const response = await fetch('/api/royal-mcp/call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'elementor_replace_text', arguments: { post_id: Number(postId), search, replace: replacement, expected_count: 1 } }) });
    const body = await response.json();
    setStatus(response.ok ? 'Saved to the live Elementor page.' : body.error || 'Save failed');
  };
  return <section className="mb-6 rounded-lg-t border border-[var(--accent-line)] bg-os-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-os-accent">Elementor widget controls</div><div className="mt-1 text-[12px] text-os-muted">Make an approved text change without opening a new tab.</div><div className="mt-3 grid gap-2 md:grid-cols-[90px_1fr_1fr_auto]"><input value={postId} onChange={(e) => setPostId(e.target.value)} aria-label="Page ID" className="rounded-sm-t border border-os-border bg-os-surface2 px-2 py-2 font-mono text-[10px]" /><input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Existing text" placeholder="Existing text" className="rounded-sm-t border border-os-border bg-os-surface2 px-2 py-2 text-[11px]" /><input value={replacement} onChange={(e) => setReplacement(e.target.value)} aria-label="Replacement text" placeholder="Replacement text" className="rounded-sm-t border border-os-border bg-os-surface2 px-2 py-2 text-[11px]" /><button onClick={() => void replaceText()} className="rounded-sm-t bg-os-accent px-3 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)]">Save change</button></div><div className="mt-2 font-mono text-[10px] text-os-ok">● {status}</div></section>;
}
