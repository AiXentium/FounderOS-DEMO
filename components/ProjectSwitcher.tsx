'use client';
import { useEffect, useState, type ChangeEvent } from 'react';
import { FolderOpen } from 'lucide-react';

type Project = { id: string; name: string; prompt?: string; direction?: string; page?: { title?: string; blocks?: string[]; generated?: boolean; contentHtml?: string; sourceType?: string; sourceUrl?: string; wordpressId?: number } };
export function ProjectSwitcher({ onLoad }: { onLoad?: (project: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState('');
  const [canonical, setCanonical] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const response = await fetch('/api/website/projects', { cache: 'no-store' });
    if (!response.ok) throw new Error('Saved projects could not be loaded.');
    const next = (await response.json()).projects as Project[];
    setProjects(next); return next;
  };
  useEffect(() => { void Promise.all([load(), fetch('/api/website/lifecycle').then(r => r.json())]).then(([, body]) => {
    if (body.state?.projectId) { setCanonical(body.state.projectId); setSelected(body.state.projectId); }
  }).catch(error => setStatus(error.message)); }, []);
  const upload = async (event: ChangeEvent<HTMLInputElement>, restore = false) => {
    const input = event.target; const file = input.files?.[0]; if (!file) return;
    setBusy(true); setStatus(restore ? 'Restoring original files...' : 'Importing ZIP...');
    try {
      const body = new FormData(); body.append('package', file);
      if (restore) body.append('projectId', selected);
      const response = await fetch('/api/website/projects/import', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Import failed.');
      const next = await load(); const project = next.find(item => item.id === result.project.id) || result.project;
      setSelected(project.id); onLoad?.(project); setStatus(restore ? 'Original files restored.' : 'Project imported.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusy(false); input.value = ''; }
  };
  const button = 'border border-os-border px-2 py-2 text-xs disabled:opacity-40';
  return <div className="min-w-0 space-y-2 border border-os-border bg-os-surface p-3">
    <label className="block text-xs"><FolderOpen className="mb-2 h-4 w-4" />Saved project
      <select aria-label="Saved website project" value={selected} onChange={e => setSelected(e.target.value)} className="mt-2 w-full min-w-0 bg-os-surface2 p-2 text-xs">
        <option value="">Choose a project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.id === canonical ? 'Canonical: ' : ''}{project.name} ({project.id.slice(0, 8)})</option>)}
      </select>
    </label>
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={busy || !selected} onClick={() => { const project = projects.find(item => item.id === selected); if (project) onLoad?.(project); }}>Load</button>
      <label className={button}>Import ZIP<input aria-label="Import website ZIP" disabled={busy} type="file" accept=".zip" className="hidden" onChange={e => void upload(e)} /></label>
      {selected && <label className={button}>Restore missing source ZIP<input aria-label="Restore missing source ZIP" disabled={busy} type="file" accept=".zip" className="hidden" onChange={e => void upload(e, true)} /></label>}
      <button className={button} disabled={busy || !selected} onClick={async () => { setBusy(true); try { const r = await fetch('/api/website/projects/clone', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selected }) }); if (!r.ok) throw new Error('Clone failed.'); await load(); setStatus('Project cloned. Select it to load.'); } catch(error) { setStatus(error instanceof Error ? error.message : 'Clone failed.'); } finally { setBusy(false); } }}>Clone</button>
    </div>
    {status && <p role="status" className="text-xs text-os-muted">{status}</p>}
  </div>;
}
