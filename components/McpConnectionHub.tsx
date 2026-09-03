'use client';

import { useState } from 'react';
import type { McpConnection } from '@/lib/mcp-connections';

export function McpConnectionHub({ items, states }: { items: McpConnection[]; states: Record<string, { connected: boolean; keySaved: boolean; detail?: string }> }) {
  const [open, setOpen] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [message, setMessage] = useState('');
  const save = async (item: McpConnection) => {
    setMessage('Saving…');
    const response = await fetch('/api/mcp/connections', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: item.id, values: values[item.id] ?? {} }) });
    const data = await response.json();
    setMessage(data.ok ? 'Saved. Refresh connector status to verify.' : data.error ?? 'Unable to save');
  };
  return <section className="mb-8 rounded-2xl border border-os-border bg-os-surface p-5">
    <div className="mb-4 flex items-start justify-between gap-4"><div><div className="text-[11px] uppercase tracking-[0.18em] text-os-accent">MCP CONNECTION HUB</div><h2 className="mt-1 text-lg font-semibold text-os-text">One place for agent connections</h2><p className="mt-1 max-w-3xl text-sm text-os-dim">Configure the shared MCP and API-backed services used by the Website Manager, Affiliate Studio, G-Brain, and social agents.</p></div>{message && <div className="text-xs text-os-dim">{message}</div>}</div>
    <div className="grid gap-3 lg:grid-cols-3">{items.map((item) => { const state = states[item.id]; return <div key={item.id} className="rounded-xl border border-os-border-strong p-4"><div className="flex items-center justify-between gap-2"><div className="font-semibold text-os-text">{item.name}</div><span className={`text-[10px] uppercase tracking-wider ${state.connected ? 'text-emerald-400' : state.keySaved ? 'text-amber-300' : 'text-os-dim'}`}>{state.connected ? 'Connected' : state.keySaved ? 'Configured' : 'Not configured'}</span></div><p className="mt-2 text-sm text-os-dim">{item.description}</p><p className="mt-2 text-xs text-os-dim">{item.note}</p><button className="mt-4 text-xs text-os-accent" onClick={() => setOpen(open === item.id ? null : item.id)}>{open === item.id ? 'Hide settings' : 'Configure here'}</button>{open === item.id && <div className="mt-3 space-y-2">{item.envKeys.map((key) => <input key={key} type={key.includes('KEY') || key.includes('PASSWORD') ? 'password' : 'text'} placeholder={key === 'VIATOR_MCP_URL' ? item.defaultUrl : key} value={values[item.id]?.[key] ?? ''} onChange={(event) => setValues({ ...values, [item.id]: { ...(values[item.id] ?? {}), [key]: event.target.value } })} className="w-full rounded-md border border-os-border bg-os-bg px-3 py-2 text-xs text-os-text" />)}<button className="w-full rounded-md bg-os-accent px-3 py-2 text-xs font-semibold text-os-bg" onClick={() => save(item)}>Save securely</button></div>}</div>})}</div>
  </section>;
}
