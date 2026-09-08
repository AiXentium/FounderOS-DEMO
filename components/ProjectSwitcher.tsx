'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { Copy, FolderOpen } from 'lucide-react';

type Project = { id: string; name: string; prompt?: string; direction?: string; page?: { title?: string; blocks?: string[]; generated?: boolean; contentHtml?: string; sourceType?: string; sourceUrl?: string; wordpressId?: number } };

export function ProjectSwitcher({ onLoad }: { onLoad?: (project: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([]); const [selected, setSelected] = useState(''); const [status, setStatus] = useState('');
  const load = async () => {
    const r = await fetch('/api/website/projects?workspace=default', { cache: 'no-store' });
    if (!r.ok) return [] as Project[];
    const nextProjects = ((await r.json()).projects ?? []) as Project[];
    setProjects(nextProjects);
    setSelected(current => current && nextProjects.some(project => project.id === current) ? current : nextProjects[0]?.id || '');
    return nextProjects as Project[];
  };
  useEffect(() => { void load(); }, []);
  const clone = async () => { if (!selected) return; const r = await fetch('/api/website/projects/clone', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selected }) }); setStatus(r.ok ? 'Project cloned' : 'Clone failed'); await load(); };
  const importPackage = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setStatus('Importing package…'); const body = new FormData(); body.append('package', file); const r = await fetch('/api/website/projects/import', { method: 'POST', body }); const result = await r.json().catch(() => ({})); if (!r.ok) { setStatus(result.error || 'Import failed'); event.target.value = ''; return; } const nextProjects = await load(); setSelected(result.project.id); onLoad?.(result.project); setStatus(`${result.project.page?.pages?.length || nextProjects.find(project => project.id === result.project.id)?.page?.blocks?.length || 0} pages imported`); event.target.value = ''; };
  const loadSelected = () => { const project = projects.find(p => p.id === selected); if (project) { onLoad?.(project); setStatus('Project loaded'); } };
  return <div className="flex flex-wrap items-center gap-2 rounded-lg-t border border-os-border bg-os-surface p-3"><FolderOpen className="h-4 w-4 text-os-accent" /><label className="font-mono text-[9px] uppercase text-os-dim">Saved project<select aria-label="Saved website project" value={selected} onChange={e => setSelected(e.target.value)} className="ml-2 rounded-sm-t border border-os-border bg-os-surface2 px-2 py-1 text-[10px] text-os-text outline-none"><option value="">New builder project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={!selected} onClick={loadSelected} className="flex items-center gap-1 rounded-sm-t border border-os-border px-2 py-1 font-mono text-[9px] uppercase disabled:opacity-40"><FolderOpen className="h-3 w-3" /> Load</button><label className="flex cursor-pointer items-center gap-1 rounded-sm-t border border-os-accent/50 px-2 py-1 font-mono text-[9px] uppercase text-os-accent hover:bg-os-surface2">Import ZIP<input type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => void importPackage(e)} /></label><button disabled={!selected} onClick={() => void clone()} className="ml-auto flex items-center gap-1 rounded-sm-t border border-os-border px-2 py-1 font-mono text-[9px] uppercase disabled:opacity-40"><Copy className="h-3 w-3" /> Clone</button>{status && <span className="font-mono text-[9px] text-os-ok">✓ {status}</span>}</div>;
}
