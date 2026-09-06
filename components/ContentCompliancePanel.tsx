'use client';

import { useEffect, useState } from 'react';
import { Check, ClipboardCheck, FileCheck2, PauseCircle, ShieldCheck } from 'lucide-react';
import { CONTENT_POLICY_SOURCES, POLICY_UPDATE_LOOP } from '@/lib/content-policy';
import type { ClaimRecord, ComplianceControls, CompliancePayload, OriginalityInput, ProvenanceRecord } from '@/lib/content-compliance';

type Review = { id: string; status: string; payload: CompliancePayload };
const PLATFORMS = ['youtube', 'tiktok', 'instagram'] as const;
const ORIGINALITY_LABELS: Array<[keyof OriginalityInput, string]> = [
  ['originalResearch', 'Original research'],
  ['newCommentary', 'New commentary or analysis'],
  ['distinctScript', 'Distinct script and viewpoint'],
  ['meaningfulEditing', 'Meaningful editing'],
  ['uniqueVisuals', 'Unique visuals'],
  ['educationalValue', 'Educational or entertainment value'],
];

export function ContentCompliancePanel({ title, uploadedAssets }: { title: string; uploadedAssets: string[] }) {
  const [platforms, setPlatforms] = useState<string[]>([...PLATFORMS]);
  const [assets, setAssets] = useState<ProvenanceRecord[]>([]);
  const [assetName, setAssetName] = useState(uploadedAssets[0] ?? '');
  const [assetType, setAssetType] = useState('image');
  const [assetSource, setAssetSource] = useState('');
  const [rightsStatus, setRightsStatus] = useState<ProvenanceRecord['rightsStatus']>('pending');
  const [license, setLicense] = useState('');
  const [claimText, setClaimText] = useState('');
  const [claimSource, setClaimSource] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [claimConfidence, setClaimConfidence] = useState<ClaimRecord['confidence']>('medium');
  const [claimApproved, setClaimApproved] = useState(false);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [originality, setOriginality] = useState<OriginalityInput>({ originalResearch: true, newCommentary: true, distinctScript: true, meaningfulEditing: true, uniqueVisuals: false, educationalValue: true });
  const [controls, setControls] = useState<ComplianceControls>({ rightsCleared: false, claimsSubstantiated: false, disclosurePresent: false, disclosurePlacement: '', platformReviewed: false, humanApproved: false });
  const [review, setReview] = useState<Review | null>(null);
  const [status, setStatus] = useState('Run the gate after registering assets and substantiating claims.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/content/provenance').then((response) => response.ok ? response.json() : { assets: [] }).then((body: { assets?: ProvenanceRecord[] }) => setAssets(body.assets ?? [])).catch(() => undefined);
  }, []);

  function togglePlatform(platform: string) {
    setPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
  }

  async function registerAsset() {
    if (!assetName.trim() || !assetSource.trim()) return setStatus('Add the asset name and source before registering it.');
    setBusy(true);
    try {
      const response = await fetch('/api/content/provenance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ assetName, assetType, source: assetSource, rightsStatus, license }) });
      const body = await response.json() as { asset?: ProvenanceRecord; error?: string };
      if (!response.ok || !body.asset) throw new Error(body.error ?? 'Asset could not be registered.');
      setAssets((current) => [body.asset!, ...current]);
      setStatus('Asset provenance recorded. Repeat for every visual, audio, voice, logo, testimonial, and AI asset.');
      setAssetName(uploadedAssets.find((name) => name !== assetName) ?? '');
      setAssetSource('');
      setLicense('');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Asset could not be registered.'); }
    finally { setBusy(false); }
  }

  function addClaim() {
    if (!claimText.trim()) return setStatus('Add a material claim before adding it to the substantiation register.');
    setClaims((current) => [...current, { text: claimText.trim(), source: claimSource.trim(), checkedAt: claimDate, confidence: claimConfidence, reviewerApproved: claimApproved }]);
    setClaimText(''); setClaimSource(''); setClaimApproved(false); setStatus('Claim added. It will stay blocked until its evidence and reviewer approval are complete.');
  }

  async function createReview() {
    setBusy(true);
    setStatus('Running originality, rights, claims, disclosure, platform, and account-health checks…');
    try {
      const response = await fetch('/api/content/compliance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, contentKind: 'video', platforms, affiliate: true, claims, assets, originality, controls }) });
      const body = await response.json() as { review?: Review; error?: string };
      if (!response.ok || !body.review) throw new Error(body.error ?? 'Compliance review could not be created.');
      setReview(body.review);
      setStatus(body.review.status === 'approved' ? 'Approved for publishing.' : 'Review created. Resolve every blocked or needs-review item before approval.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Compliance review could not be created.'); }
    finally { setBusy(false); }
  }

  async function updateReview(patch: { controls?: Partial<ComplianceControls>; originality?: Partial<OriginalityInput> }) {
    if (!review) return;
    const response = await fetch(`/api/content/compliance/${review.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
    const body = await response.json() as { review?: Review; error?: string };
    if (response.ok && body.review) { setReview(body.review); setControls(body.review.payload.controls); setStatus('Review updated.'); }
    else setStatus(body.error ?? 'Review could not be updated.');
  }

  async function approve() {
    if (!review) return;
    setBusy(true);
    const response = await fetch(`/api/content/compliance/${review.id}/approve`, { method: 'POST' });
    const body = await response.json() as { review?: Review; error?: string };
    if (body.review) { setReview(body.review); setControls(body.review.payload.controls); }
    setStatus(response.ok ? 'Human approval recorded. This review can now authorize live or scheduled publishing.' : body.error ?? 'Approval is blocked until every gate passes.');
    setBusy(false);
  }

  return <section className="mt-5 rounded-sm-t border border-[var(--accent-line)] bg-os-bg2 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.17em] text-os-accent"><ShieldCheck className="h-3.5 w-3.5" /> Mandatory pre-publish gate</div><h3 className="mt-2 text-[18px] font-semibold">Draft → review → human approval → publish → monitor</h3><p className="mt-1 max-w-4xl text-[13px] leading-5 text-os-dim">This gate is shared by the video brief and Social publisher. Live or scheduled posts require an approved review ID; drafts can still be saved for later review.</p></div>{review && <span className="rounded-sm-t border border-os-border px-2 py-1 font-mono text-[10px] uppercase text-os-muted">{review.status.replaceAll('_', ' ')}</span>}</div>

    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className="rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Platform checklist</div><div className="mt-2 flex flex-wrap gap-2">{PLATFORMS.map((platform) => <button type="button" key={platform} onClick={() => togglePlatform(platform)} className={`rounded-sm-t border px-2.5 py-1.5 font-mono text-[10px] uppercase ${platforms.includes(platform) ? 'border-os-accent bg-os-accent/10 text-os-accent' : 'border-os-border text-os-dim'}`}>{platforms.includes(platform) ? '✓ ' : ''}{platform}</button>)}</div>{platforms.map((platform) => <div key={platform} className="mt-2 text-[11px] leading-4 text-os-dim"><span className="font-semibold text-os-text">{platform}:</span> {(review?.payload.platformRules[platform] ?? ['Commercial disclosure, rights, claims, AI-media, music, and posting limits require review.']).join(' ')}</div>)}<label className="mt-3 flex items-center gap-2 text-[12px] text-os-muted"><input type="checkbox" checked={controls.platformReviewed} onChange={(event) => { const next = { ...controls, platformReviewed: event.target.checked }; setControls(next); void updateReview({ controls: { platformReviewed: next.platformReviewed } }); }} /> I reviewed the selected platform checklists.</label></div>

      <div className="rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Originality score</div><div className="mt-2 grid gap-1.5 sm:grid-cols-2">{ORIGINALITY_LABELS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[12px] text-os-dim"><input type="checkbox" checked={originality[key]} onChange={(event) => { const next = { ...originality, [key]: event.target.checked }; setOriginality(next); if (review) void updateReview({ originality: { [key]: event.target.checked } }); }} />{label}</label>)}</div><p className="mt-2 text-[11px] text-os-muted">The score is a quality signal, not a guarantee of platform approval. Scores below 70 block approval.</p></div>
    </div>

    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <div className="rounded-sm-t border border-os-border bg-os-surface p-3"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted"><FileCheck2 className="h-3.5 w-3.5 text-os-accent" /> Rights and provenance ledger</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Asset name or uploaded filename" aria-label="Asset name" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]" /><select value={assetType} onChange={(e) => setAssetType(e.target.value)} aria-label="Asset type" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]"><option value="image">Image</option><option value="video">Video clip</option><option value="audio">Music / audio</option><option value="voice">Voice</option><option value="logo">Logo</option><option value="testimonial">Testimonial</option><option value="ai">AI asset</option></select><input value={assetSource} onChange={(e) => setAssetSource(e.target.value)} placeholder="Source or origin" aria-label="Asset source" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px] sm:col-span-2" /><select value={rightsStatus} onChange={(e) => setRightsStatus(e.target.value as ProvenanceRecord['rightsStatus'])} aria-label="Rights status" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]"><option value="pending">Pending review</option><option value="cleared">Cleared</option><option value="restricted">Restricted</option><option value="unknown">Unknown</option></select><input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="License / permission reference" aria-label="License" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]" /></div><button type="button" onClick={() => void registerAsset()} disabled={busy} className="mt-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase text-os-accent disabled:opacity-50">Register asset rights</button>{assets.length > 0 && <div className="mt-3 space-y-1">{assets.slice(0, 5).map((asset) => <div key={asset.id} className="flex items-center justify-between gap-2 text-[11px] text-os-dim"><span className="truncate">{asset.assetName}</span><span className={asset.rightsStatus === 'cleared' ? 'text-os-ok' : 'text-os-warn'}>{asset.rightsStatus}</span></div>)}</div>}<label className="mt-3 flex items-center gap-2 text-[12px] text-os-muted"><input type="checkbox" checked={controls.rightsCleared} onChange={(event) => { const next = { ...controls, rightsCleared: event.target.checked }; setControls(next); if (review) void updateReview({ controls: { rightsCleared: next.rightsCleared } }); }} /> I verified commercial rights for every listed asset.</label></div>

      <div className="rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Claims substantiation</div><input value={claimText} onChange={(e) => setClaimText(e.target.value)} placeholder="Material claim in the draft" aria-label="Claim text" className="mt-2 w-full rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]" /><input value={claimSource} onChange={(e) => setClaimSource(e.target.value)} placeholder="Source URL or evidence reference" aria-label="Claim source" className="mt-2 w-full rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]" /><div className="mt-2 grid gap-2 sm:grid-cols-2"><input type="date" value={claimDate} onChange={(e) => setClaimDate(e.target.value)} aria-label="Claim checked date" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px] [color-scheme:dark]" /><select value={claimConfidence} onChange={(e) => setClaimConfidence(e.target.value as ClaimRecord['confidence'])} aria-label="Claim confidence" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-2 text-[12px]"><option value="high">High confidence</option><option value="medium">Medium confidence</option><option value="low">Low confidence</option></select></div><label className="mt-2 flex items-center gap-2 text-[12px] text-os-muted"><input type="checkbox" checked={claimApproved} onChange={(e) => setClaimApproved(e.target.checked)} /> Reviewer approved this claim.</label><button type="button" onClick={addClaim} className="mt-2 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase text-os-accent">Add substantiated claim</button>{claims.length > 0 && <div className="mt-3 space-y-1">{claims.map((claim) => <div key={`${claim.text}-${claim.checkedAt}`} className="flex items-start justify-between gap-2 text-[11px] text-os-dim"><span className="min-w-0">{claim.text}</span><span className={claim.reviewerApproved && claim.source ? 'text-os-ok' : 'text-os-warn'}>{claim.reviewerApproved && claim.source ? 'ready' : 'needs review'}</span></div>)}</div>}<label className="mt-3 flex items-center gap-2 text-[12px] text-os-muted"><input type="checkbox" checked={controls.claimsSubstantiated} onChange={(event) => { const next = { ...controls, claimsSubstantiated: event.target.checked }; setControls(next); if (review) void updateReview({ controls: { claimsSubstantiated: next.claimsSubstantiated } }); }} /> I verified every material claim against its evidence.</label></div>
    </div>

    <div className="mt-3 rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Disclosure enforcement</div><p className="mt-2 text-[13px] leading-5 text-os-text">“This post contains affiliate links. I may earn a commission if you purchase through my link.”</p><div className="mt-2 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-[12px] text-os-muted"><input type="checkbox" checked={controls.disclosurePresent} onChange={(event) => { const next = { ...controls, disclosurePresent: event.target.checked }; setControls(next); if (review) void updateReview({ controls: { disclosurePresent: next.disclosurePresent } }); }} /> Disclosure is included near the recommendation.</label><select value={controls.disclosurePlacement} onChange={(e) => { const next = { ...controls, disclosurePlacement: e.target.value as ComplianceControls['disclosurePlacement'] }; setControls(next); if (review) void updateReview({ controls: { disclosurePlacement: next.disclosurePlacement } }); }} aria-label="Disclosure placement" className="rounded-sm-t border border-os-border bg-os-bg2 px-2.5 py-1.5 text-[12px]"><option value="">Select placement</option><option value="video">In video</option><option value="caption">Caption</option><option value="email">Email</option><option value="page">Landing page</option><option value="near_recommendation">Near recommendation</option></select></div></div>

    {review && <div className="mt-3 rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Gate results · {review.payload.originality.score}/100 originality</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{review.payload.checks.map((item) => <div key={item.id} className="rounded-sm-t border border-os-border bg-os-surface2 p-2.5"><div className={`font-mono text-[10px] uppercase ${item.status === 'pass' ? 'text-os-ok' : item.status === 'blocked' ? 'text-os-err' : 'text-os-warn'}`}>{item.status.replace('_', ' ')}</div><div className="mt-1 text-[12px] font-semibold">{item.label}</div><p className="mt-1 text-[11px] leading-4 text-os-dim">{item.evidence}</p></div>)}</div><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void createReview()} disabled={busy} className="flex items-center gap-1.5 rounded-sm-t border border-os-border px-3 py-2 font-mono text-[10px] uppercase text-os-accent disabled:opacity-50"><ClipboardCheck className="h-3 w-3" /> Re-run gate</button><button type="button" onClick={() => void approve()} disabled={busy || review.status === 'approved'} className="flex items-center gap-1.5 rounded-sm-t bg-os-accent px-3 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)] disabled:opacity-50"><Check className="h-3 w-3" /> {review.status === 'approved' ? 'Approved' : 'Approve for publishing'}</button>{review.payload.accountHealth.paused && <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-os-err"><PauseCircle className="h-3 w-3" /> Publishing paused</span>}</div><p className="mt-2 text-[12px] text-os-muted">Review ID: <code>{review.id}</code> · use this ID for a live or scheduled Social post.</p></div>}

    <div className="mt-3 rounded-sm-t border border-os-border bg-os-surface p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-muted">Policy update loop</div><div className="mt-2 flex flex-wrap gap-1.5">{POLICY_UPDATE_LOOP.map((step, index) => <span key={step} className="rounded-sm-t border border-os-border px-2 py-1 text-[11px] text-os-dim">{index + 1}. {step}</span>)}</div><div className="mt-3 flex flex-wrap gap-3">{CONTENT_POLICY_SOURCES.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="text-[11px] text-os-accent hover:underline">{source.name} ↗</a>)}</div></div>
    <p className="mt-2 text-[12px] text-os-muted">{status}</p>
  </section>;
}
