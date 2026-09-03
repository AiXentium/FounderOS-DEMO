'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

type Page = { id: number; title?: { rendered?: string }; link?: string; editUrl?: string; isBuiltWithElementor?: boolean };

export function WordPressSiteEditor({ onElementorPageSelected }: { onElementorPageSelected?: (url: string) => void }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [status, setStatus] = useState('Loading connected site…');
  const [selected, setSelected] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showEmbeddedElementor, setShowEmbeddedElementor] = useState(false);

  const loadPages = async () => {
    setStatus('Loading WordPress pages…');
    const [response, elementorResponse] = await Promise.all([
      fetch('/api/wordpress?operation=listPages&siteId=primary&agent=WebsiteBuilder'),
      fetch('/api/elementor?operation=listPages&siteId=primary&agent=WebsiteBuilder'),
    ]);
    const body = await response.json();
    const elementorBody = await elementorResponse.json();
    if (!response.ok) return setStatus(body.detail || body.error || 'WordPress connection failed');
    const livePages = body.result?.items || body.result || [];
    const elementorPages = elementorBody.result?.items || elementorBody.result || [];
    const editUrls = new Map(elementorPages.map((page: Page) => [String(page.id), page.editUrl]));
    setPages(livePages.map((page: Page) => ({ ...page, editUrl: editUrls.get(String(page.id)) })));
    setStatus('Connected · live WordPress pages');
  };

  useEffect(() => { void loadPages(); }, []);

  const editPage = async (page: Page) => {
    setSelected(page);
    if (page.link) onElementorPageSelected?.(page.link);
    setShowEmbeddedElementor(false);
    const response = await fetch(`/api/wordpress?operation=getPage&siteId=primary&agent=WebsiteBuilder&id=${page.id}`);
    const body = await response.json();
    const live = body.result || {};
    setTitle(live.title?.rendered || page.title?.rendered || '');
    setContent(live.content?.rendered || '');
  };

  const savePage = async () => {
    if (!selected) return;
    setStatus('Saving to WordPress…');
    const response = await fetch('/api/wordpress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'updatePage', siteId: 'primary', agent: 'WebsiteBuilder', params: { id: selected.id }, data: { title, content } }) });
    setStatus(response.ok ? 'Saved to WordPress' : 'WordPress save failed');
  };

  return <section className="mb-6 rounded-lg-t border border-os-border bg-os-surface p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-os-dim">Live site editor</div>
        <div className="mt-1 text-[14px] font-semibold">letstalkmilesandtravel.com</div>
        <div className="mt-1 font-mono text-[10px] text-os-ok">● {status}</div>
      </div>
      <div className="flex gap-2">
        <a href="https://letstalkmilesandtravel.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2"><ExternalLink className="h-3.5 w-3.5" /> View site</a>
        <button onClick={() => void loadPages()} className="flex items-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {pages.length === 0 ? <div className="font-mono text-[10px] text-os-dim">No pages returned.</div> : pages.map((page) => <div key={page.id} className={`rounded-sm-t border p-3 ${selected?.id === page.id ? 'border-[var(--accent-line)] bg-os-accent/5' : 'border-os-border bg-os-surface2'}`}><button onClick={() => void editPage(page)} className="w-full truncate text-left text-[12px] font-semibold hover:text-os-accent">{page.title?.rendered || `Page ${page.id}`}</button><div className="mt-2 flex gap-3 font-mono text-[10px] uppercase"><a href={page.link} target="_blank" rel="noreferrer" className="text-os-muted hover:text-os-accent">Preview</a>{page.editUrl ? <button onClick={() => void editPage(page)} className="text-os-accent hover:underline">Open in Elementor ↗</button> : <span className="text-os-dim">WordPress page</span>}</div></div>)}
    </div>
    {selected && <div className="mt-4 border-t border-os-border pt-4"><div className="mb-3 flex items-center justify-between"><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-os-dim">In-OS visual editor · {selected.isBuiltWithElementor ? 'Elementor page' : 'WordPress page'}</div><span className="font-mono text-[9px] uppercase text-os-accent">Changes preview instantly</span></div><div className="grid gap-4 xl:grid-cols-2"><div><label className="mb-1 block font-mono text-[9px] uppercase text-os-dim">Page title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3 w-full rounded-sm-t border border-os-border bg-os-surface2 px-3 py-2 text-[14px] font-semibold" /><label className="mb-1 block font-mono text-[9px] uppercase text-os-dim">Page content (HTML supported)</label><textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-56 w-full rounded-sm-t border border-os-border bg-os-surface2 p-3 font-mono text-[11px]" /></div><div><div className="mb-1 font-mono text-[9px] uppercase text-os-dim">Live canvas</div><div className="min-h-56 overflow-auto rounded-sm-t border border-os-border bg-white p-6 text-[#1c211d]"><h1 className="mb-4 text-3xl font-semibold">{title || 'Untitled page'}</h1><div className="prose max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content || '<p>Start editing this page on the left.</p>' }} /></div></div></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void savePage()} className="rounded-sm-t bg-os-accent px-3 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)]">Save to WordPress</button>{selected.editUrl && <button onClick={() => setShowEmbeddedElementor((value) => !value)} className="rounded-sm-t border border-[var(--accent-line)] px-3 py-2 font-mono text-[10px] uppercase text-os-accent">{showEmbeddedElementor ? 'Hide embedded Elementor' : 'Open embedded Elementor'}</button>}</div>{showEmbeddedElementor && selected.editUrl && <div className="mt-4 rounded-sm-t border border-[var(--accent-line)] bg-black"><div className="border-b border-os-border px-3 py-2 font-mono text-[9px] uppercase text-os-accent">Elementor editor inside Business OS · agents can use the connected page context</div><iframe title="Embedded Elementor editor" src={selected.editUrl} className="h-[720px] w-full border-0" /></div>}</div>}
  </section>;
}
