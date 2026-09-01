'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Copy, Link2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Badge, SectionHead } from '@/components/terminal';

type Product = { id: number | string; name: string; source: string; price?: string; commission?: string; url: string; status?: string; trackedUrl?: string };
type Campaign = { id: string; name: string; platforms?: string[]; status?: string };

const initialProducts: Product[] = [
  { id: 1, name: 'Wireless Noise-Canceling Headphones', source: 'Amazon', price: '$89.99', commission: '4%', url: 'https://amazon.com/dp/example', status: 'ready' },
  { id: 2, name: 'Portable Espresso Maker', source: 'Amazon', price: '$49.00', commission: '6%', url: 'https://amazon.com/dp/example-2', status: 'ready' },
  { id: 3, name: 'Creator Desk Light', source: 'Manual import', price: '$39.95', commission: '10%', url: 'https://example.com/creator-light', status: 'draft' },
];

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
  useEffect(() => { fetch('/api/affiliate/products').then(r => r.ok ? r.json() : { products: [] }).then(body => { if (body.products?.length) setProducts(body.products); }).catch(() => undefined); fetch('/api/affiliate/campaigns').then(r => r.ok ? r.json() : { campaigns: [] }).then(body => setCampaigns(body.campaigns ?? [])).catch(() => undefined); }, []);
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

  return (
    <div>
      <PageHeader eyebrow="growth / monetization" title="Affiliate Studio" right={<Badge tone="ok">● local MVP</Badge>} />

      <div className="mb-7 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[['Products', products.length], ['Tracked links', 24], ['Posts queued', 8], ['Attributed revenue', '$1,284']].map(([label, value]) => (
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
      <div className="mb-7 flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by niche or keyword…" className="flex-1 rounded-sm-t border border-os-border bg-os-surface px-3 py-3 font-mono text-[11px] outline-none placeholder:text-os-dim" /><button onClick={async () => { const r = await fetch('/api/affiliate/discover', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: search }) }); const body = await r.json(); if (body.products?.length) setProducts([...body.products.map((p: Product) => ({ ...p, id: products.length + Math.random() })), ...products]); }} className="flex items-center justify-center gap-2 rounded-sm-t border border-os-border bg-os-surface px-4 py-2 font-mono text-[10px] uppercase hover:bg-os-surface2"><Sparkles className="h-3.5 w-3.5 text-os-accent" /> Auto-discover products</button></div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section>
          <SectionHead label="Product library" count={`${products.length} items`} />
          <div className="overflow-hidden rounded-lg-t border border-os-border bg-os-surface">
            {products.map((product) => (
              <button key={product.id} onClick={() => { setSelected(product.id); setGenerated(false); }} className={`flex w-full items-center gap-3 border-b border-os-border px-4 py-4 text-left last:border-0 ${selected === product.id ? 'bg-os-accent/10' : 'hover:bg-os-surface2'}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-sm-t border border-os-border text-os-accent"><Link2 className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{product.name}</div><div className="mt-1 font-mono text-[10px] text-os-dim">{product.source} · {product.price} · {product.commission} commission</div></div>
                <span className="font-mono text-[9px] uppercase text-os-dim">{product.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHead label="Campaign builder" count="AI-ready" />
          <div className="rounded-lg-t border border-os-border bg-os-surface p-4">
            <div className="mb-4 flex items-start justify-between gap-3"><div><div className="text-[15px] font-semibold">{active.name}</div><div className="mt-1 font-mono text-[10px] text-os-dim">Generate platform-specific content with this tracked link</div></div><ArrowUpRight className="h-4 w-4 text-os-dim" /></div>
            <div className="mb-3 rounded-sm-t border border-os-border bg-os-bg2 p-3"><div className="font-mono text-[9px] uppercase tracking-[0.12em] text-os-dim">Tracked URL</div><div className="mt-2 break-all font-mono text-[10px] text-os-accent">{trackedLink}</div></div>
            <div className="flex gap-2"><button onClick={copyLink} className="flex flex-1 items-center justify-center gap-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-os-surface2">{copied ? <Check className="h-3.5 w-3.5 text-os-ok" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy link'}</button><button onClick={async () => { await fetch('/api/affiliate/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productName: active.name, platform: 'instagram', affiliateUrl: trackedLink }) }); setGenerated(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-sm-t bg-os-accent px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)]"><Wand2 className="h-3.5 w-3.5" /> Generate post</button></div>
            {generated && <div className="mt-4 rounded-sm-t border border-[var(--accent-line)] bg-os-accent/5 p-3"><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-os-accent"><Sparkles className="h-3.5 w-3.5" /> Draft generated</div><p className="text-[13px] leading-relaxed">Upgrade your everyday setup with {active.name}. Clean design, better results, and a smart pick for creators who want more from their workflow. #creatorgear #founderos</p><button onClick={async () => { await fetch('/api/social/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ caption: `Upgrade your everyday setup with ${active.name}. See it here: ${trackedLink}`, platforms: ['instagram', 'tiktok', 'linkedin'] }) }); setQueued(true); }} className="mt-3 w-full rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-os-surface2">{queued ? '✓ Queued in Social publisher' : 'Queue across social channels'}</button></div>}
          </div>
        </section>
      </div>
      <section className="mt-7"><SectionHead label="Custom campaign" count={`${campaigns.length} saved`} /><div className="flex flex-col gap-2 rounded-lg-t border border-os-border bg-os-surface p-4 md:flex-row"><input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign name, e.g. Back-to-school creator setup" className="flex-1 bg-transparent px-1 py-2 text-[13px] outline-none placeholder:text-os-dim" /><button disabled={!active} onClick={async () => { if (!campaignName || !active) return; const response = await fetch('/api/affiliate/campaigns', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: campaignName, productIds: [String(active.id)], platforms: ['instagram', 'tiktok', 'linkedin'] }) }); const body = await response.json(); if (response.ok && body.campaign) setCampaigns((current) => [body.campaign, ...current]); setCampaignName(''); }} className="rounded-sm-t bg-os-accent px-4 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-40">Create campaign</button></div>{campaigns.length > 0 && <div className="mt-2 overflow-hidden rounded-lg-t border border-os-border bg-os-surface">{campaigns.slice(0, 8).map((campaign) => <div key={campaign.id} className="flex items-center gap-3 border-b border-os-border px-4 py-3 last:border-0"><span className="min-w-0 flex-1 truncate text-[12px]">{campaign.name}</span><span className="font-mono text-[9px] uppercase text-os-dim">{campaign.platforms?.join(' · ') || 'social'} · {campaign.status || 'draft'}</span></div>)}</div>}</section>
    </div>
  );
}
