'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Copy, Link2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Badge, SectionHead } from '@/components/terminal';

type Product = { id: number | string; name: string; source: string; price?: string; commission?: string; url: string; status?: string; trackedUrl?: string; imageUrl?: string };
type Campaign = { id: string; name: string; platforms?: string[]; status?: string };

const initialProducts: Product[] = [];

export default function AffiliateStudioPage() {
  const [products, setProducts] = useState(initialProducts);
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<number | string>(1);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [queued, setQueued] = useState(false);
  const [search, setSearch] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [provider, setProvider] = useState('all');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([{ role: 'agent', text: 'I’m your Affiliate Studio strategist. Tell me a destination, audience, or season and I’ll brainstorm concepts, find live products, and prepare a draft campaign for your review.' }]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  useEffect(() => { fetch('/api/affiliate/products').then(r => r.ok ? r.json() : { products: [] }).then(body => setProducts(body.products ?? [])).catch(() => undefined); fetch('/api/affiliate/campaigns').then(r => r.ok ? r.json() : { campaigns: [] }).then(body => setCampaigns(body.campaigns ?? [])).catch(() => undefined); }, []);
  const active = products.find((p) => String(p.id) === String(selected)) ?? products[0];
  const trackedLink = useMemo(() => active ? (active.trackedUrl || `${active.url}${active.url.includes('?') ? '&' : '?'}utm_source=business-os&utm_medium=social&utm_campaign=affiliate_${active.id}`) : '', [active]);

  async function importProduct() {
    if (!url.trim()) return;
    const next = products.length + 1;
    const importedUrl = url.trim();
    const response = await fetch('/api/affiliate/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: importedUrl }) }); const body = await response.json(); const imported = body.product ? { ...body.product, price: '—', commission: 'pending', status: 'needs review' } : { id: next, name: 'Imported product', source: 'URL import', price: '—', commission: 'pending', url: importedUrl, status: 'needs review' }; setProducts([imported, ...products]); setSelected(imported.id);
    setUrl('');
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(trackedLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function runAssistant() {
    if (!assistantMessage.trim()) return;
    const request = assistantMessage.trim();
    setAssistantMessages((current) => [...current, { role: 'user', text: request }]);
    setAssistantMessage('');
    setAssistantBusy(true);
    try {
      const response = await fetch('/api/affiliate/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: assistantMessage }) });
      const body = await response.json();
      const reply = body.reply ?? body.error ?? 'The agent returned no response.';
      setAssistantReply(reply);
      setAssistantMessages((current) => [...current, { role: 'agent', text: reply + (body.products?.length ? ` Sample ideas: ${body.products.slice(0, 3).map((p: Product) => p.name).join(' · ')}` : '') }]);
      if (body.products?.length) setProducts((current) => [...body.products, ...current]);
      if (body.campaign) setCampaigns((current) => [body.campaign, ...current]);
    } catch { setAssistantReply('The agent is unavailable. Check the OS connection and try again.'); }
    finally { setAssistantBusy(false); }
  }

  async function analyzeImages() {
    if (!uploadedImages.length) return;
    setAssistantBusy(true);
    const names = uploadedImages.map(({ file }) => file.name).join(', ');
    try {
      await Promise.all(uploadedImages.map(async ({ file }) => { const form = new FormData(); form.append('file', file); form.append('folder', 'affiliate-studio'); await fetch('/api/assets', { method: 'POST', body: form }); }));
      const response = await fetch('/api/affiliate/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: `Analyze these uploaded travel images: ${names}. Identify likely locations, brainstorm campaign angles, and find matching Viator experiences.` }) });
      const body = await response.json();
      const reply = body.reply ?? body.error ?? 'Image analysis returned no response.';
      setAssistantReply(reply);
      setAssistantMessages((current) => [...current, { role: 'user', text: `Uploaded ${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'}: ${names}` }, { role: 'agent', text: reply }]);
      if (body.products?.length) setProducts((current) => [...body.products, ...current]);
    } finally { setAssistantBusy(false); }
  }

  return (
    <div className="affiliate-studio-page">
      <PageHeader eyebrow="growth / monetization" title="Affiliate Studio" right={<Badge tone="ok">● local MVP</Badge>} />

      <section className="mb-7 rounded-lg-t border border-[var(--accent-line)] bg-os-surface p-4">
        <SectionHead label="Affiliate Studio agent" count="live search · draft campaigns · human approval" />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={assistantMessage} onChange={(e) => setAssistantMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void runAssistant(); }} placeholder="Ask: find Spain holiday experiences and create a campaign…" aria-label="Affiliate Studio agent request" className="flex-1 rounded-sm-t border border-os-border bg-os-bg2 px-3 py-3 font-mono text-[20px] outline-none placeholder:text-os-dim" />
          <button disabled={!assistantMessage.trim() || assistantBusy} onClick={() => void runAssistant()} className="rounded-sm-t bg-os-accent px-4 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-40">{assistantBusy ? 'Working…' : 'Ask agent'}</button>
        </div>
        <div className="mt-3 space-y-2 rounded-sm-t border border-os-border bg-os-bg2 p-3">{assistantMessages.slice(-6).map((item, index) => <div key={`${item.role}-${index}`} className={`text-[20px] leading-relaxed ${item.role === 'agent' ? 'border-l-2 border-os-accent pl-3 text-os-copy' : 'text-os-dim'}`}><span className="mr-2 font-mono text-[11px] uppercase text-os-accent">{item.role === 'agent' ? 'agent' : 'you'}</span>{item.text}</div>)}</div>
        <div className="mt-3 flex flex-wrap gap-2">{['Find Spain holiday ideas', 'Brainstorm summer travel', 'Create a Lake Como campaign'].map((prompt) => <button key={prompt} onClick={() => { setAssistantMessage(prompt); }} className="rounded-sm-t border border-os-border px-3 py-2 font-mono text-[12px] uppercase text-os-dim hover:bg-os-surface2">{prompt}</button>)}</div>
      </section>

      <section className="mb-7 rounded-lg-t border border-os-border bg-os-surface p-4">
        <SectionHead label="Visual campaign brief" count="upload images · recognize location · brainstorm" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"><label className="flex cursor-pointer items-center justify-center rounded-sm-t border border-dashed border-os-border px-4 py-4 font-mono text-[16px] uppercase text-os-accent hover:bg-os-surface2"><Plus className="mr-2 h-4 w-4" /> Upload travel images<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setUploadedImages(Array.from(e.target.files ?? []).map((file) => ({ file, preview: URL.createObjectURL(file) })))} /></label><button disabled={!uploadedImages.length || assistantBusy} onClick={() => void analyzeImages()} className="rounded-sm-t bg-os-accent px-4 py-3 font-mono text-[16px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-40">{assistantBusy ? 'Analyzing…' : 'Analyze & brainstorm campaign'}</button></div>
        {uploadedImages.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{uploadedImages.map(({ file, preview }) => <div key={file.name} className="overflow-hidden rounded-sm-t border border-os-border"><img src={preview} alt={file.name} className="h-28 w-full object-cover" /><div className="truncate px-2 py-2 font-mono text-[12px]">{file.name}</div></div>)}</div>}
      </section>

      <div className="mb-7 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[['Products', products.length], ['Tracked links', products.filter((p) => p.trackedUrl || p.url).length], ['Posts queued', '—'], ['Attributed revenue', '—']].map(([label, value]) => (
          <div key={label} className="rounded-lg-t border border-os-border bg-os-surface px-4 py-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-os-dim">{label}</div>
            <div className="mt-2 font-mono text-[25px] font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <SectionHead label="Import product or affiliate URL" count="Amazon · AliExpress · CJ · Impact · manual" />
      <div className="mb-7 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-sm-t border border-os-border bg-os-surface px-3">
          <Link2 className="h-4 w-4 text-os-accent" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && importProduct()} placeholder="Paste a product or affiliate URL…" className="w-full bg-transparent py-3 font-mono text-[12px] outline-none placeholder:text-os-dim" />
        </div>
        <button onClick={importProduct} className="flex items-center justify-center gap-2 rounded-sm-t border border-[var(--accent-line)] bg-os-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)]"><Plus className="h-4 w-4" /> Import product</button>
      </div>
      <div className="mb-7 flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by niche or keyword…" className="flex-1 rounded-sm-t border border-os-border bg-os-surface px-3 py-3 font-mono text-[11px] outline-none placeholder:text-os-dim" /><select value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Affiliate networks to search" className="rounded-sm-t border border-os-border bg-os-surface px-3 py-2 font-mono text-[10px] uppercase"><option value="all">All connected networks</option><option value="viator">Viator</option><option value="manual">Manual imports</option></select><button onClick={async () => { const r = await fetch('/api/affiliate/discover', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: search, provider }) }); const body = await r.json(); if (body.products?.length) setProducts([...body.products, ...products]); }} className="flex items-center justify-center gap-2 rounded-sm-t border border-os-border bg-os-surface px-4 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2"><Sparkles className="h-3.5 w-3.5 text-os-accent" /> Auto-discover products</button></div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="flex items-center justify-between"><SectionHead label="Product library" count={`${products.length} items`} /><div className="mb-3 flex rounded-sm-t border border-os-border bg-os-surface p-1"><button onClick={() => setViewMode('list')} className={`px-2 py-1 font-mono text-[9px] uppercase ${viewMode === 'list' ? 'bg-os-accent text-[var(--accent-ink)]' : 'text-os-dim'}`}>List</button><button onClick={() => setViewMode('grid')} className={`px-2 py-1 font-mono text-[9px] uppercase ${viewMode === 'grid' ? 'bg-os-accent text-[var(--accent-ink)]' : 'text-os-dim'}`}>Cards</button></div></div>
          <div className={`overflow-hidden rounded-lg-t border border-os-border bg-os-surface ${viewMode === 'grid' ? 'grid grid-cols-1 gap-px bg-os-border sm:grid-cols-2' : ''}`}>
            {products.length === 0 && <div className="px-4 py-10 text-center font-mono text-[11px] text-os-dim">No live products yet. Choose a connected network and run discovery.</div>}
            {products.map((product) => (
              <button key={product.id} onClick={() => { setSelected(product.id); setGenerated(false); }} className={`flex w-full items-center gap-3 border-b border-os-border bg-os-surface px-4 py-4 text-left last:border-0 ${viewMode === 'grid' ? 'min-w-0 flex-col items-stretch' : ''} ${selected === product.id ? 'bg-os-accent/10' : 'hover:bg-os-surface2'}`}>
                {product.imageUrl ? <img src={`/api/affiliate/image?url=${encodeURIComponent(product.imageUrl)}`} alt={`${product.name} destination`} loading="lazy" className={`${viewMode === 'grid' ? 'h-36 w-full' : 'h-16 w-24'} shrink-0 rounded-sm-t border border-os-border object-cover`} /> : <div className={`${viewMode === 'grid' ? 'h-36 w-full' : 'h-16 w-24'} flex shrink-0 flex-col items-center justify-center gap-1 rounded-sm-t border border-dashed border-os-border text-os-dim`}><Link2 className="h-4 w-4 text-os-accent" /><span className="font-mono text-[8px] uppercase">No image</span></div>}
                <div className="min-w-0 flex-1"><div className="truncate text-[20px] font-medium">{product.name}</div><div className="mt-1 font-mono text-[14px] text-os-dim">{product.source} · {product.price} · {product.commission} commission</div></div>
                <span className="font-mono text-[9px] uppercase text-os-dim">{product.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHead label="Campaign builder" count="AI-ready" />
          <div className="rounded-lg-t border border-os-border bg-os-surface p-4">
            {!active ? <div className="py-10 text-center font-mono text-[11px] text-os-dim">Select a live product to build a campaign.</div> : <><div className="mb-4 flex items-start justify-between gap-3"><div><div className="text-[15px] font-semibold">{active.name}</div><div className="mt-1 font-mono text-[10px] text-os-dim">Generate platform-specific content with this tracked link</div></div><ArrowUpRight className="h-4 w-4 text-os-dim" /></div>
            <div className="mb-3 rounded-sm-t border border-os-border bg-os-bg2 p-3"><div className="font-mono text-[9px] uppercase tracking-[0.12em] text-os-dim">Tracked URL</div><div className="mt-2 break-all font-mono text-[10px] text-os-accent">{trackedLink}</div></div>
            <div className="flex gap-2"><button onClick={copyLink} className="flex flex-1 items-center justify-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-os-surface2">{copied ? <Check className="h-3.5 w-3.5 text-os-ok" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy link'}</button><button onClick={async () => { await fetch('/api/affiliate/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productName: active.name, platform: 'instagram', affiliateUrl: trackedLink }) }); setGenerated(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-sm-t bg-os-accent px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)]"><Wand2 className="h-3.5 w-3.5" /> Generate post</button></div>
            {generated && <div className="mt-4 rounded-sm-t border border-[var(--accent-line)] bg-os-accent/5 p-3"><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-os-accent"><Sparkles className="h-3.5 w-3.5" /> Draft generated</div><p className="text-[13px] leading-relaxed">Discover {active.name} and plan your next trip with a tracked recommendation. #travel #letstalkmiles</p><button onClick={async () => { await fetch('/api/social/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ caption: `Discover ${active.name}. See it here: ${trackedLink}`, platforms: ['instagram', 'tiktok', 'linkedin'] }) }); setQueued(true); }} className="mt-3 w-full rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-os-surface2">{queued ? '✓ Queued in Social publisher' : 'Queue across social channels'}</button></div>}</>}
          </div>
        </section>
      </div>
      <section className="mt-7"><SectionHead label="Custom campaign" count={`${campaigns.length} saved`} /><div className="flex flex-col gap-2 rounded-lg-t border border-os-border bg-os-surface p-4 md:flex-row"><input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign name, e.g. Back-to-school creator setup" className="flex-1 bg-transparent px-1 py-2 text-[13px] outline-none placeholder:text-os-dim" /><button disabled={!active} onClick={async () => { if (!campaignName || !active) return; const response = await fetch('/api/affiliate/campaigns', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: campaignName, productIds: [String(active.id)], platforms: ['instagram', 'tiktok', 'linkedin'] }) }); const body = await response.json(); if (response.ok && body.campaign) setCampaigns((current) => [body.campaign, ...current]); setCampaignName(''); }} className="rounded-sm-t bg-os-accent px-4 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-40">Create campaign</button></div>{campaigns.length > 0 && <div className="mt-2 overflow-hidden rounded-lg-t border border-os-border bg-os-surface">{campaigns.slice(0, 8).map((campaign) => <div key={campaign.id} className="flex items-center gap-3 border-b border-os-border px-4 py-3 last:border-0"><span className="min-w-0 flex-1 truncate text-[12px]">{campaign.name}</span><span className="font-mono text-[9px] uppercase text-os-dim">{campaign.platforms?.join(' · ') || 'social'} · {campaign.status || 'draft'}</span></div>)}</div>}</section>
    </div>
  );
}
