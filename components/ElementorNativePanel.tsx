'use client';

import { useState } from 'react';

export function ElementorNativePanel() {
  const [postId, setPostId] = useState('991');
  const [outline, setOutline] = useState<any>(null);
  const [status, setStatus] = useState('Select an Elementor page to inspect its real structure.');
  const load = async () => {
    setStatus('Loading Elementor structure…');
    const response = await fetch(`/api/royal-mcp/elementor/outline?postId=${postId}`);
    const body = await response.json();
    if (!response.ok) return setStatus(body.error || 'Unable to load Elementor structure');
    const text = body.result?.content?.[0]?.text;
    setOutline(typeof text === 'string' ? JSON.parse(text) : text);
    setStatus('Connected · real Elementor structure');
  };
  return <section className="mb-6 rounded-lg-t border border-[var(--accent-line)] bg-os-surface p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-os-accent">Native Elementor editor</div><div className="mt-1 text-[12px] text-os-muted">Edit real Elementor elements through Business OS and Royal MCP.</div></div><div className="flex gap-2"><input value={postId} onChange={(event) => setPostId(event.target.value)} aria-label="WordPress page ID" className="w-20 rounded-sm-t border border-os-border bg-os-surface2 px-2 py-2 font-mono text-[10px]" /><button onClick={() => void load()} className="rounded-sm-t bg-os-accent px-3 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)]">Load structure</button></div></div><div className="mt-2 font-mono text-[10px] text-os-ok">● {status}</div>{outline && <div className="mt-4 grid gap-2 md:grid-cols-3">{(outline.outline || []).map((container: any, index: number) => <div key={container.id || index} className="rounded-sm-t border border-os-border bg-os-surface2 p-3"><div className="font-mono text-[10px] uppercase text-os-accent">Container {index + 1}</div>{(container.children || []).map((child: any) => <div key={child.id} className="mt-2 border-t border-os-border pt-2 text-[11px]"><span className="text-os-muted">{child.widgetType || child.elType}</span>{child.snippet && <div className="mt-1 truncate">{child.snippet}</div>}</div>)}</div>)}</div>}</section>;
}
