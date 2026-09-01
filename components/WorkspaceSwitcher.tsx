'use client';

import { useEffect, useState } from 'react';

type Workspace = { id: string; name: string; slug: string };

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState('default');
  useEffect(() => { const saved = window.localStorage.getItem('founder-os-workspace'); if (saved) setSelected(saved); fetch('/api/workspaces').then(r => r.ok ? r.json() : { workspaces: [] }).then(b => setWorkspaces(b.workspaces ?? [])).catch(() => undefined); }, []);
  return <label className="flex items-center gap-2 font-mono text-[9px] uppercase text-os-dim"><span className="hidden sm:inline">workspace</span><select aria-label="Current workspace" value={selected} onChange={e => { setSelected(e.target.value); window.localStorage.setItem('founder-os-workspace', e.target.value); }} className="max-w-[150px] rounded-sm-t border border-os-border bg-os-surface px-2 py-1 text-[10px] text-os-text outline-none"><option value="default">Default workspace</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>;
}
