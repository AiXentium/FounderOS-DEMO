'use client';

import { ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

type CampaignPlan = {
  video?: { title: string; cta: string };
  repurposing?: Array<{ channel: string; deliverable: string; purpose: string }>;
  bridge?: { page: string; optIn: string };
  approvalGates?: string[];
};

export function WebsiteCampaignFlow({ onPrepareWebsite }: { onPrepareWebsite: (prompt: string) => Promise<void> }) {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [offer, setOffer] = useState('');
  const [evidence, setEvidence] = useState('');
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function prepare() {
    if (!topic.trim() || !audience.trim() || !offer.trim()) { setStatus('Add a topic, audience, and offer first.'); return; }
    setBusy(true); setStatus('Preparing the website and channel plan…');
    try {
      const response = await fetch('/api/content/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic, audience, offer, evidence }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.plan) throw new Error(body.error || 'Could not prepare the campaign.');
      setPlan(body.plan);
      await onPrepareWebsite(`Build a complete campaign-ready website for ${topic}. The audience is ${audience}. The offer is ${offer}. Use the evidence packet: ${evidence || 'Needs client input.'}. Create the page tree, bridge page, email capture path, SEO resource, and social content destinations. Do not publish anything.`);
      setStatus('Website draft and cross-channel plan are ready for review.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not prepare the campaign.'); }
    finally { setBusy(false); }
  }

  return <section className="border border-os-accent/40 bg-os-accent/5 p-4">
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">Campaign flow</div><h2 className="mt-1 text-[18px] font-semibold">Turn one idea into an organized growth system.</h2><p className="mt-2 max-w-2xl text-[12px] leading-5 text-os-muted">Prepare the website, bridge page, email path, SEO resource, and platform-specific social drafts together. Publishing stays approval-gated.</p></div><div className="flex items-center gap-2 font-mono text-[10px] text-os-muted"><span className="h-2 w-2 rounded-full bg-os-ok" /> Website + social orchestration</div></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-[11px] text-os-muted">Campaign topic<input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Barcelona trip planning" className="mt-1 w-full border border-os-border bg-os-surface px-3 py-2 text-[12px] text-os-copy outline-none focus:border-[var(--accent-line)]" /></label><label className="text-[11px] text-os-muted">Audience<input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="First-time Spain travelers" className="mt-1 w-full border border-os-border bg-os-surface px-3 py-2 text-[12px] text-os-copy outline-none focus:border-[var(--accent-line)]" /></label><label className="text-[11px] text-os-muted">Offer or next action<input value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Download the 3-day itinerary" className="mt-1 w-full border border-os-border bg-os-surface px-3 py-2 text-[12px] text-os-copy outline-none focus:border-[var(--accent-line)]" /></label><label className="text-[11px] text-os-muted">Evidence and source notes<input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Official sources, first-hand notes, approved links" className="mt-1 w-full border border-os-border bg-os-surface px-3 py-2 text-[12px] text-os-copy outline-none focus:border-[var(--accent-line)]" /></label></div>
    <button type="button" onClick={() => void prepare()} disabled={busy} className="mt-4 flex items-center gap-2 bg-os-accent px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)] disabled:opacity-60">{busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Prepare website + social plan</button>
    {status && <p className={`mt-3 text-[11px] ${status.includes('ready') ? 'text-os-ok' : 'text-os-muted'}`}>{status}</p>}
    {plan && <div className="mt-4 grid gap-3 border-t border-os-border pt-4 lg:grid-cols-[1fr_1fr]"><div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">Channel package</div><div className="mt-2 space-y-2">{plan.repurposing?.map((item) => <div key={item.channel} className="border border-os-border bg-os-surface p-3"><div className="text-[12px] font-semibold">{item.channel}</div><div className="mt-1 text-[11px] leading-4 text-os-muted">{item.deliverable}</div></div>)}</div></div><div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">Approval path</div><div className="mt-2 space-y-2">{['Website draft', 'Social drafts', 'Rights and claims review', 'Human approval', 'Publish or schedule'].map((stage, index) => <div key={stage} className="flex items-center gap-2 border border-os-border bg-os-surface p-3 text-[11px]"><span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${index < 2 ? 'border-os-ok text-os-ok' : 'border-os-border text-os-dim'}`}>{index < 2 ? <Check className="h-3 w-3" /> : index + 1}</span>{stage}<span className="ml-auto font-mono text-[9px] uppercase text-os-dim">{index < 2 ? 'prepared' : index === 2 ? 'required' : 'locked'}</span></div>)}</div><p className="mt-3 text-[11px] leading-5 text-os-muted">{plan.bridge?.page} {plan.bridge?.optIn}</p></div></div>}
  </section>;
}
