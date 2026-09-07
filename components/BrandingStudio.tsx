'use client';

import { useEffect, useState } from 'react';
import { Check, Palette, Save, Sparkles } from 'lucide-react';
import type { BrandBlueprint } from '@/lib/brand-vault';
import type { VaultTemplate } from '@/lib/template-vault';

const EMPTY: BrandBlueprint = {
  businessName: '', businessType: '', audience: '', offer: '', positioning: '',
  voice: 'Clear, useful, warm, specific, and trustworthy.',
  visualDirection: 'Editorial, confident, spacious, and conversion-ready.',
  imageDirection: 'Use original, client-supplied, or rights-cleared imagery. Replace every placeholder before publishing.',
  primaryColor: '#1c211d', secondaryColor: '#f4f0e7', accentColor: '#d9683a',
  headingFont: 'Editorial serif', bodyFont: 'Readable sans-serif', logoNotes: '',
  frontendTemplateId: 'editorial-studio', backendTemplateId: 'agency-ops', fullStackTemplateId: 'affiliate-magazine',
  channels: ['Website', 'Blog', 'Email', 'YouTube', 'Instagram', 'TikTok', 'Pinterest'], approvalStatus: 'draft',
};

function Field({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  return <label className="block text-[11px] text-os-muted">{label}{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 min-h-20 w-full resize-y border border-os-border bg-os-surface2 px-3 py-2 text-[13px] leading-5 text-os-copy outline-none focus:border-[var(--accent-line)]" /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full border border-os-border bg-os-surface2 px-3 py-2 text-[13px] text-os-copy outline-none focus:border-[var(--accent-line)]" />}</label>;
}

export function BrandingStudio({ compact = false }: { compact?: boolean }) {
  const [brand, setBrand] = useState<BrandBlueprint>(EMPTY);
  const [templates, setTemplates] = useState<VaultTemplate[]>([]);
  const [status, setStatus] = useState('Loading the business brand vault…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/brand?workspace=default', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/templates', { cache: 'no-store' }).then((response) => response.json()),
    ]).then(([brandBody, templateBody]) => {
      if (brandBody.brand?.blueprint) setBrand({ ...EMPTY, ...brandBody.brand.blueprint });
      setTemplates(templateBody.templates ?? []);
      setStatus(brandBody.brand ? 'Brand vault loaded · shared with G-Brain and the agents' : 'New brand blueprint · ready for setup');
    }).catch(() => setStatus('Brand vault could not be loaded.'));
  }, []);

  const update = (key: keyof BrandBlueprint, value: string) => setBrand((current) => ({ ...current, [key]: value }));
  const options = (kind: VaultTemplate['kind']) => templates.filter((template) => template.kind === kind || template.kind === 'full-stack');

  async function save(nextBrand = brand) {
    setBusy(true); setStatus('Saving brand blueprint…');
    try {
      const response = await fetch('/api/brand', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(nextBrand) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Brand blueprint could not be saved.');
      setBrand({ ...EMPTY, ...body.brand.blueprint });
      setStatus('Brand blueprint saved · agents can now use it');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Brand blueprint could not be saved.'); }
    finally { setBusy(false); }
  }

  return <section className={compact ? 'border border-os-accent/40 bg-os-accent/5 p-5' : 'mb-8'}>
    {!compact && <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-os-accent">Branding studio · business vault</div>}
    <div className="border border-os-accent/40 bg-os-accent/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent"><Sparkles className="h-3.5 w-3.5" /> Brand blueprint</div><h2 className="mt-2 text-[22px] font-semibold">Create the identity every team can use.</h2><p className="mt-2 max-w-3xl text-[13px] leading-6 text-os-muted">This is the source of truth for the website, dashboard, content, social channels, email, and affiliate campaigns. It stays isolated to this workspace and is included in G-Brain context.</p></div><div className="font-mono text-[10px] uppercase text-os-dim">{brand.approvalStatus}</div></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Business name" value={brand.businessName} onChange={(value) => update('businessName', value)} placeholder="Let's Talk Miles & Travel" /><Field label="Business type" value={brand.businessType} onChange={(value) => update('businessType', value)} placeholder="Travel media and affiliate business" /><Field label="Primary audience" value={brand.audience} onChange={(value) => update('audience', value)} placeholder="Travelers who want better points and miles decisions" /><Field label="Core offer or next action" value={brand.offer} onChange={(value) => update('offer', value)} placeholder="Guides, itineraries, and trusted booking recommendations" /><Field label="Positioning" value={brand.positioning} onChange={(value) => update('positioning', value)} multiline /><Field label="Brand voice" value={brand.voice} onChange={(value) => update('voice', value)} multiline /><Field label="Visual direction" value={brand.visualDirection} onChange={(value) => update('visualDirection', value)} multiline /><Field label="Image and media rules" value={brand.imageDirection} onChange={(value) => update('imageDirection', value)} multiline /></div>
      <div className="mt-5 border-t border-os-border pt-4"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent"><Palette className="h-3.5 w-3.5" /> Design tokens</div><div className="mt-3 grid gap-4 md:grid-cols-3"><label className="text-[11px] text-os-muted">Primary color<div className="mt-1 flex gap-2"><input type="color" value={brand.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} className="h-9 w-12 border border-os-border bg-transparent" /><input value={brand.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} className="min-w-0 flex-1 border border-os-border bg-os-surface2 px-2 text-[12px]" /></div></label><label className="text-[11px] text-os-muted">Secondary color<div className="mt-1 flex gap-2"><input type="color" value={brand.secondaryColor} onChange={(event) => update('secondaryColor', event.target.value)} className="h-9 w-12 border border-os-border bg-transparent" /><input value={brand.secondaryColor} onChange={(event) => update('secondaryColor', event.target.value)} className="min-w-0 flex-1 border border-os-border bg-os-surface2 px-2 text-[12px]" /></div></label><label className="text-[11px] text-os-muted">Accent color<div className="mt-1 flex gap-2"><input type="color" value={brand.accentColor} onChange={(event) => update('accentColor', event.target.value)} className="h-9 w-12 border border-os-border bg-transparent" /><input value={brand.accentColor} onChange={(event) => update('accentColor', event.target.value)} className="min-w-0 flex-1 border border-os-border bg-os-surface2 px-2 text-[12px]" /></div></label><Field label="Heading type direction" value={brand.headingFont} onChange={(value) => update('headingFont', value)} placeholder="Editorial serif" /><Field label="Body type direction" value={brand.bodyFont} onChange={(value) => update('bodyFont', value)} placeholder="Readable sans-serif" /><Field label="Logo notes and variants" value={brand.logoNotes} onChange={(value) => update('logoNotes', value)} placeholder="Primary logo, alternate mark, social icon…" /></div></div>
      <div className="mt-5 border-t border-os-border pt-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">Template starting points</div><p className="mt-1 text-[12px] leading-5 text-os-muted">Choose separate foundations for the public website, the operating dashboard, and the complete full-stack system. Agents can adapt them without losing this brand direction.</p><div className="mt-3 grid gap-4 md:grid-cols-3">{([['frontendTemplateId', 'Front-end website', 'frontend'], ['backendTemplateId', 'Back-end / dashboard', 'backend'], ['fullStackTemplateId', 'Full-stack system', 'full-stack']] as const).map(([key, label, kind]) => <label key={key} className="text-[11px] text-os-muted">{label}<select value={brand[key]} onChange={(event) => update(key, event.target.value)} className="mt-1 w-full border border-os-border bg-os-surface2 px-2 py-2 text-[12px] text-os-copy">{options(kind).map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>)}</div></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => { const next = { ...brand, approvalStatus: 'review' as const }; setBrand(next); void save(next); }} disabled={busy} className="flex items-center gap-2 bg-os-accent px-4 py-2.5 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-50"><Save className="h-3.5 w-3.5" /> Save blueprint for review</button><span className="flex items-center gap-1 text-[11px] text-os-muted"><Check className="h-3.5 w-3.5 text-os-ok" /> {status}</span></div>
    </div>
  </section>;
}
