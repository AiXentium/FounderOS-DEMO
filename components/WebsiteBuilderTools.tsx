'use client';

import { useEffect, useState } from 'react';
import { SectionInspector, type SectionDesign } from '@/components/SectionInspector';

type Asset = { name: string; size: number; modifiedAt: string; url: string };

export function WebsiteBuilderTools({ projectId, prompt, title, direction, blocks, generated }: { projectId?: string; prompt: string; title: string; direction: string; blocks: string[]; generated: boolean }) {
  const [status, setStatus] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [design, setDesign] = useState<SectionDesign>({ subtitle: 'We design practical operating systems, sharp brands, and calm growth engines for ambitious small teams.', cta: 'See how it works', accent: '#1c211d' });
  useEffect(() => { const key = `business-os-design-${projectId || 'draft'}`; try { const saved = JSON.parse(window.localStorage.getItem(key) || 'null'); if (saved && typeof saved.subtitle === 'string' && typeof saved.cta === 'string' && typeof saved.accent === 'string') setDesign(saved); } catch { window.localStorage.removeItem(key); } }, [projectId]);

  const loadAssets = async () => {
    const response = await fetch('/api/assets');
    if (response.ok) setAssets((await response.json()).assets ?? []);
  };
  useEffect(() => { void loadAssets(); }, []);

  const saveProject = async () => {
    const response = await fetch('/api/website/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: projectId, name: title || 'Untitled website', prompt, direction, page: { title, blocks, generated, design } }) });
    if (response.ok) { const body = await response.json(); const savedId = body.project?.id || projectId || 'draft'; window.localStorage.setItem(`business-os-design-${savedId}`, JSON.stringify(design)); setStatus('Project saved locally'); } else setStatus('Save failed');
  };
  const saveTemplate = () => {
    let saved: unknown[] = [];
    try { const value = JSON.parse(window.localStorage.getItem('business-os-custom-templates') || '[]'); if (Array.isArray(value)) saved = value; } catch { window.localStorage.removeItem('business-os-custom-templates'); }
    const template = { id: `custom-${Date.now()}`, name: title || 'Untitled template', kind: 'frontend', description: prompt || 'Custom website template', styles: [direction], components: blocks, animation: 'custom motion recipe', source: 'Business OS project' };
    window.localStorage.setItem('business-os-custom-templates', JSON.stringify([template, ...saved]));
    window.dispatchEvent(new Event('business-os-templates-changed'));
    setStatus('Template saved to vault');
  };
  const exportProject = async () => {
    const response = await fetch('/api/website/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: title || 'Untitled website', title, prompt, direction, blocks }) });
    const body = await response.json();
    const htmlBlob = new Blob([body.html ?? ''], { type: 'text/html' }); const htmlLink = document.createElement('a'); htmlLink.href = URL.createObjectURL(htmlBlob); htmlLink.download = body.filename ?? 'website-project.html'; htmlLink.click(); URL.revokeObjectURL(htmlLink.href);
    const jsonBlob = new Blob([JSON.stringify(body.project ?? body, null, 2)], { type: 'application/json' }); const jsonLink = document.createElement('a'); jsonLink.href = URL.createObjectURL(jsonBlob); jsonLink.download = 'website-project.json'; jsonLink.click(); URL.revokeObjectURL(jsonLink.href);
    setStatus('HTML and project JSON downloaded');
  };
  const removeAsset = async (name: string) => { await fetch(`/api/assets?name=${encodeURIComponent(name)}`, { method: 'DELETE' }); await loadAssets(); };
  const renameAsset = async (asset: Asset) => { const next = window.prompt('Rename asset', asset.name); if (!next || next === asset.name) return; const response = await fetch('/api/assets', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: asset.name, newName: next }) }); setStatus(response.ok ? 'Asset renamed' : 'Rename failed'); await loadAssets(); };
  const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

  return <>
    <SectionInspector value={design} onChange={setDesign} />
    <div className="rounded-lg-t border border-os-border bg-os-surface p-3">
      <button onClick={() => void exportProject()} className="mb-2 flex w-full items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2">Export React / HTML (project JSON)</button>
      <button onClick={() => void saveProject()} className="flex w-full items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2">Save project</button>
      <button onClick={saveTemplate} className="mt-2 flex w-full items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2">Save to template vault</button>
      {status && <div className="mt-2 font-mono text-[10px] text-os-ok">✓ {status}</div>}
    </div>
    <div className="rounded-lg-t border border-os-border bg-os-surface p-3">
      <div className="mb-2 font-mono text-[9px] uppercase text-os-dim">Saved assets</div>
      {assets.length === 0 ? <div className="font-mono text-[10px] text-os-dim">No uploaded files yet.</div> : assets.map((asset) => <div key={asset.name} className="border-b border-os-border py-2 last:border-0"><div className="flex items-center gap-2">{isImage(asset.name) ? <img src={asset.url} alt="" className="h-8 w-8 rounded-sm-t object-cover" /> : <div className="grid h-8 w-8 place-items-center rounded-sm-t border border-os-border font-mono text-[9px] text-os-dim">FILE</div>}<a href={asset.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[11px] text-os-accent">{asset.name}</a><button onClick={() => void renameAsset(asset)} className="font-mono text-[9px] uppercase text-os-muted">Rename</button><button onClick={() => void removeAsset(asset.name)} className="font-mono text-[9px] uppercase text-os-warn">Delete</button></div><div className="mt-1 pl-10 font-mono text-[9px] text-os-dim">{Math.ceil(asset.size / 1024)} KB · local asset</div></div>)}
    </div>
  </>;
}
