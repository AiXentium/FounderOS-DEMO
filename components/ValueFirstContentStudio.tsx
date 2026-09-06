'use client';

import { Check, Clipboard, FileText, Image as ImageIcon, Mail, Play, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { ValueFirstPlan } from '@/lib/value-first-content';

const lanes = [
  ['01', 'Research packet', 'One source of truth with evidence, rights, and brand direction.'],
  ['02', 'Humanized faceless video', 'Original commentary, real visuals, and a useful point of view.'],
  ['03', 'Owned-audience bridge', 'A clear opt-in page and email follow-up before affiliate offers.'],
  ['04', 'Durable distribution', 'SEO resource, newsletter, and Pinterest versions with a human review.'],
] as const;

export function ValueFirstContentStudio() {
  const [topic, setTopic] = useState('Planning a smarter Barcelona neighborhood itinerary');
  const [audience, setAudience] = useState('Travelers who want local food, points, and bookable experiences without wasting a day');
  const [offer, setOffer] = useState('the Barcelona planning guide and approved experience shortlist');
  const [evidence, setEvidence] = useState('Use current destination research, first-hand notes, official attraction details, and verified partner links.');
  const [realImages, setRealImages] = useState('Use our owned travel photos or licensed destination images with source and alt text.');
  const [plan, setPlan] = useState<ValueFirstPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Build a production brief from your real research and assets.');
  const [assetStatus, setAssetStatus] = useState('No assets attached to this source packet yet.');
  const [copied, setCopied] = useState(false);

  async function uploadAssets(files: FileList | null) {
    if (!files?.length) return;
    setAssetStatus(`Uploading ${files.length} asset${files.length === 1 ? '' : 's'}…`);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'value-first-content');
        const response = await fetch('/api/assets', { method: 'POST', body: form });
        if (response.ok) uploaded += 1;
      }
    } catch {
      setAssetStatus(`${uploaded}/${files.length} assets attached. The remaining uploads could not be reached.`);
      return;
    }
    setAssetStatus(`${uploaded}/${files.length} asset${files.length === 1 ? '' : 's'} attached to the value-first content folder.`);
  }

  async function createPlan() {
    if (busy) return;
    setBusy(true);
    setStatus('Building a reviewable value-first plan…');
    try {
      const response = await fetch('/api/content/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, audience, offer, evidence, realImages }),
      });
      const body = await response.json() as { plan?: ValueFirstPlan; error?: unknown };
      if (!response.ok || !body.plan) throw new Error(typeof body.error === 'string' ? body.error : 'The content plan could not be created.');
      setPlan(body.plan);
      setStatus('Plan ready for Content, Brand, SEO, Affiliate, and Social review.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The content plan could not be created.');
    } finally {
      setBusy(false);
    }
  }

  async function copyPlan() {
    if (!plan) return;
    const text = [
      plan.video.title,
      plan.video.promise,
      `Hook: ${plan.video.hook}`,
      ...plan.video.narration,
      `CTA: ${plan.video.cta}`,
      `Bridge: ${plan.bridge.page}`,
      `SEO: ${plan.seo.title}`,
    ].join('\n\n');
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mb-8 rounded-lg-t border border-[var(--accent-line)] bg-os-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-os-accent"><Sparkles className="h-3.5 w-3.5" /> Value-first content engine</div>
          <h2 className="mt-2 text-[21px] font-semibold">Create useful faceless video systems, not content spam.</h2>
          <p className="mt-2 max-w-4xl text-[14px] leading-6 text-os-dim">One researched source packet becomes a humanized video, owned-audience bridge, SEO resource, newsletter, and Pinterest distribution plan. Nothing is published automatically from this panel.</p>
        </div>
        <span className="rounded-sm-t border border-[color-mix(in_oklab,var(--ok)_35%,transparent)] bg-[color-mix(in_oklab,var(--ok)_9%,transparent)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-os-ok">human approval required</span>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-4">
        {lanes.map(([number, title, detail]) => <div key={number} className="rounded-sm-t border border-os-border bg-os-surface2 p-3"><div className="font-mono text-[10px] text-os-accent">{number}</div><h3 className="mt-2 text-[14px] font-semibold">{title}</h3><p className="mt-1 text-[12px] leading-5 text-os-dim">{detail}</p></div>)}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-sm-t border border-os-border bg-os-surface2 p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-os-muted"><FileText className="h-3.5 w-3.5 text-os-accent" /> Source packet</div>
          <label className="mt-4 block text-[12px] text-os-muted">Topic<input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded-sm-t border border-os-border bg-os-bg2 px-3 py-2.5 text-[13px] text-os-text outline-none focus:border-os-accent" /></label>
          <label className="mt-3 block text-[12px] text-os-muted">Audience<input value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 w-full rounded-sm-t border border-os-border bg-os-bg2 px-3 py-2.5 text-[13px] text-os-text outline-none focus:border-os-accent" /></label>
          <label className="mt-3 block text-[12px] text-os-muted">Offer or next step<input value={offer} onChange={(e) => setOffer(e.target.value)} className="mt-1 w-full rounded-sm-t border border-os-border bg-os-bg2 px-3 py-2.5 text-[13px] text-os-text outline-none focus:border-os-accent" /></label>
          <label className="mt-3 block text-[12px] text-os-muted">Evidence and source requirements<textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3} className="mt-1 w-full resize-y rounded-sm-t border border-os-border bg-os-bg2 px-3 py-2.5 text-[13px] leading-5 text-os-text outline-none focus:border-os-accent" /></label>
          <label className="mt-3 block text-[12px] text-os-muted"><span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Real image / footage plan</span><textarea value={realImages} onChange={(e) => setRealImages(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-sm-t border border-os-border bg-os-bg2 px-3 py-2.5 text-[13px] leading-5 text-os-text outline-none focus:border-os-accent" /></label>
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-sm-t border border-dashed border-os-border bg-os-bg2 px-3 py-3 text-[12px] text-os-muted hover:border-os-accent"><ImageIcon className="h-4 w-4 shrink-0 text-os-accent" /><span className="min-w-0 flex-1"><span className="block font-semibold text-os-text">Attach real images, footage, audio, or project files</span><span className="mt-1 block text-[11px]">Stored in the separate value-first-content asset folder.</span></span><input type="file" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.md" onChange={(e) => void uploadAssets(e.target.files)} className="sr-only" /></label>
          <p className="mt-2 text-[11px] text-os-muted">{assetStatus}</p>
          <button type="button" onClick={() => void createPlan()} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm-t bg-os-accent px-4 py-3 text-[13px] font-bold text-[var(--accent-ink)] disabled:opacity-50"><Play className="h-3.5 w-3.5" />{busy ? 'Building plan…' : 'Create production plan'}</button>
          <p className="mt-2 text-[12px] text-os-muted">{status}</p>
        </div>

        <div className="rounded-sm-t border border-os-border bg-os-bg2 p-4">
          {!plan ? <div className="grid min-h-[360px] place-items-center text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-os-border bg-os-surface text-os-accent"><Search className="h-5 w-5" /></div><h3 className="mt-3 text-[16px] font-semibold">Your plan preview appears here</h3><p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-os-dim">Create a plan to inspect the hook, narration, visuals, bridge page, SEO structure, and distribution outputs before anything reaches a channel.</p></div></div> : <PlanPreview plan={plan} copied={copied} onCopy={() => void copyPlan()} />}
        </div>
      </div>
    </section>
  );
}

function PlanPreview({ plan, copied, onCopy }: { plan: ValueFirstPlan; copied: boolean; onCopy: () => void }) {
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-os-border pb-3"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-os-accent">Draft preview · not published</div><h3 className="mt-1 text-[19px] font-semibold">{plan.video.title}</h3></div><button type="button" onClick={onCopy} className="flex items-center gap-1.5 rounded-sm-t border border-os-border px-2.5 py-1.5 font-mono text-[10px] uppercase text-os-muted hover:text-os-accent"><Clipboard className="h-3 w-3" />{copied ? 'Copied' : 'Copy brief'}</button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <PreviewCard title="Video promise" icon={<Play className="h-3.5 w-3.5" />}><p>{plan.video.promise}</p><p className="mt-2 text-os-accent">Hook: {plan.video.hook}</p></PreviewCard>
      <PreviewCard title="Bridge page" icon={<Mail className="h-3.5 w-3.5" />}><p>{plan.bridge.page}</p><p className="mt-2 text-os-accent">Opt-in: {plan.bridge.optIn}</p></PreviewCard>
    </div>
    <div className="mt-3 rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Narration draft</div>{plan.video.narration.map((line) => <p key={line} className="mt-2 text-[13px] leading-5 text-os-text">{line}</p>)}</div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><PreviewList title="Shot list" items={plan.video.shotList} /><PreviewList title="Durable distribution" items={plan.repurposing.map((item) => `${item.channel}: ${item.deliverable}`)} /></div>
    <div className="mt-3 rounded-sm-t border border-os-border bg-os-surface p-3"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted"><ShieldCheck className="h-3.5 w-3.5 text-os-ok" /> Approval gates</div>{plan.approvalGates.map((gate) => <div key={gate} className="mt-2 flex gap-2 text-[12px] leading-5 text-os-dim"><Check className="mt-1 h-3 w-3 shrink-0 text-os-ok" />{gate}</div>)}</div>
    <div className="mt-3 rounded-sm-t border border-[var(--accent-line)] bg-os-accent/5 p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">G-Brain handoff</div><p className="mt-1 text-[12px] leading-5 text-os-dim">{plan.productionRule} Use the G-Brain command center above to route this brief to the content, brand, SEO, affiliate, and social agents for review.</p></div>
  </div>;
}

function PreviewCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-sm-t border border-os-border bg-os-surface p-3"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">{icon}{title}</div><div className="mt-2 text-[12px] leading-5 text-os-dim">{children}</div></div>;
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">{title}</div>{items.map((item) => <div key={item} className="mt-2 flex gap-2 text-[12px] leading-5 text-os-dim"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-os-accent" />{item}</div>)}</div>;
}
