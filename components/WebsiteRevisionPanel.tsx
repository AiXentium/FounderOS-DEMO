'use client';
import { useEffect, useState } from 'react';
import type { WebsiteLifecycle } from '@/lib/website-revision-schema';

export function WebsiteRevisionPanel({ projectId }: { projectId: string }) {
  const [state, setState] = useState<WebsiteLifecycle | null>(null);
  const [pages, setPages] = useState<Array<{ title: string; path: string }>>([]);
  const [pagePath, setPagePath] = useState('');
  const [request, setRequest] = useState('Improve this page using its existing real content and images. Preserve its design and links. Identify missing information.');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState('');
  const [editing, setEditing] = useState(false);
  const [build, setBuild] = useState('');
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [affiliateProducts, setAffiliateProducts] = useState<Array<{ id: string; name: string; source: string; status: string }>>([]);
  const [affiliateProductId, setAffiliateProductId] = useState('');
  const refresh = async () => {
    const response = await fetch('/api/website/lifecycle', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load page revisions.');
    const body = await response.json(); setState(body.state); setBuild(body.build);
  };
  useEffect(() => {
    void refresh().catch(error => setMessage(error.message));
    void fetch('/api/website/projects').then(r => r.json()).then(body => {
      const project = body.projects.find((item: any) => item.id === projectId);
      const next = (project?.page?.pages ?? []).map((item: any) => ({ title: item.title, path: item.file?.startsWith(project.page.packageRoot + '/') ? item.file.slice(project.page.packageRoot.length + 1) : '' })).filter((item: any) => item.path);
      setPages(next); setPagePath(next.find((item: any) => item.path === 'index.html')?.path || next[0]?.path || '');
    }).catch(error => setMessage(error.message));
    void fetch('/api/templates').then(r => r.json()).then(body => setTemplates(body.templates || [])).catch(() => undefined);
    void fetch('/api/affiliate/products').then(r => r.json()).then(body => { const products = (body.products || []).filter((item: any) => item.status === 'approved' && String(item.source).toLowerCase().includes('amazon')); setAffiliateProducts(products); setAffiliateProductId(products[0]?.id || ''); }).catch(() => undefined);
    const timer = setInterval(() => void refresh().catch(() => undefined), 4000);
    return () => clearInterval(timer);
  }, [projectId]);
  const revision = state?.revisions.find(item => item.id === state.selectedId);
  const action = async (name: string, revisionId = revision?.id, targetPagePath = pagePath) => {
    setBusy(true); setMessage('');
    try {
      const agentRequest = name === 'runAll' ? 'Preserve every factual statement, image, and link unless a verified correction is required. Apply approved existing components and templates, improve SEO, match only existing source images to the story, propose only destination-relevant Viator and approved manual Amazon offers, verify internal links and mobile behavior, and save a reviewable revision. Never invent content, prices, reviews, images, or experiences.' : request;
      const response = await fetch('/api/website/lifecycle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: name, projectId, version: state?.version ?? 0, pagePath: targetPagePath, revisionId, request: agentRequest, ...(name === 'save' ? { html } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Request failed.');
      setState(body.state); setMessage(body.queued ? `${body.queued} fresh page revisions queued from immutable sources. The existing specialists will process them sequentially.` : body.jobId ? 'Page work queued. Results will appear here.' : `${name === 'canonical' ? 'Canonical page selected' : name.charAt(0).toUpperCase() + name.slice(1) + ' saved'}.`);
      if (name === 'save') setEditing(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Request failed.'); await refresh().catch(() => undefined); }
    finally { setBusy(false); }
  };
  const button = 'border border-os-border px-3 py-2 text-xs disabled:opacity-40';
  const manage = async (payload: Record<string, unknown>) => {
    if (!state) return; setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/website/manage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projectId, version: state.version, revisionId: revision?.id, actor: { type: 'human', id: 'business-os-owner', label: 'Business OS owner' }, ...payload }) });
      const body = await response.json(); if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Structured edit failed.');
      setState(body.state); setMessage('Structured page revision saved. Preview it, run QA, and approve before publishing.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Structured edit failed.'); await refresh().catch(() => undefined); } finally { setBusy(false); }
  };
  const promptManage = (actionName: string) => {
    if (actionName === 'createPage') {
      const path = window.prompt('New page path (for example campaigns/summer-madrid/index.html)'); if (!path) return;
      const title = window.prompt('Page title'); if (!title) return;
      const pageType = window.prompt('Page type: standard, article, destination, or campaign', 'campaign') || 'campaign';
      void manage({ action: 'createPage', pagePath: path, title, pageType }); return;
    }
    if (actionName === 'updateSeo') {
      const title = window.prompt('SEO title', revision?.document?.seo.title || ''); if (title === null) return;
      const description = window.prompt('Meta description', revision?.document?.seo.description || ''); if (description === null) return;
      const canonical = window.prompt('Canonical URL (optional)', revision?.document?.seo.canonical || ''); if (canonical === null) return;
      void manage({ action: 'updateSeo', seo: { title, description, canonical: canonical || undefined, noIndex: revision?.document?.seo.noIndex || false } }); return;
    }
    if (actionName === 'editSourceText') {
      const match = window.prompt('Exact visible text to replace'); if (!match) return;
      const replacement = window.prompt('Replacement text (plain text only)', match); if (replacement === null) return;
      void manage({ action: 'editSourceText', match, replacement }); return;
    }
    if (actionName === 'swapSourceImage') {
      const sourceUrl = window.prompt('Exact current image URL or path'); if (!sourceUrl) return;
      const replacementUrl = window.prompt('Replacement image URL or imported asset path'); if (!replacementUrl) return;
      const alt = window.prompt('Accessible alt text', '') ?? '';
      void manage({ action: 'swapSourceImage', sourceUrl, replacementUrl, alt }); return;
    }
    if (actionName === 'editSourceCta') {
      const match = window.prompt('Exact current button/link label'); if (!match) return;
      const replacement = window.prompt('New button/link label', match); if (replacement === null) return;
      const href = window.prompt('New destination URL or path (leave blank to keep current)', '') ?? '';
      void manage({ action: 'editSourceCta', match, replacement, href: href || undefined }); return;
    }
    if (actionName === 'schedule') {
      const scheduleAction = window.prompt('Schedule action: publish or unpublish', 'publish'); if (!scheduleAction) return;
      const scheduledFor = window.prompt('Date and time (ISO format, for example 2026-09-10T14:00:00-04:00)'); if (!scheduledFor) return;
      void manage({ action: 'schedule', scheduleAction, scheduledFor, pagePath: state?.pagePath, revisionId: revision?.id });
    }
  };
  const running = state?.runs.some(item => item.status === 'running');
  if (state && state.projectId !== projectId) return <div className="p-4 text-os-text">This duplicate is not the canonical project. Load project {state.projectId} from Saved Projects to continue the pilot.</div>;
  return <section className="min-w-0 bg-os-surface text-os-text">
    <div className="space-y-3 border-b border-os-border p-4">
      <div className="text-xs">{state ? `Canonical page: ${state.pagePath}` : 'Choose the canonical project and one pilot page'}</div>
      {!state && <><select aria-label="Pilot page" className="max-w-full bg-os-surface2 p-2 text-xs" value={pagePath} onChange={e => setPagePath(e.target.value)}>{pages.map(page => <option key={page.path} value={page.path}>{page.title} ({page.path})</option>)}</select><button className={button} disabled={busy || !pagePath} onClick={() => void action('canonical')}>Use this project and page</button></>}
      {state && revision && <>
        <select aria-label="Selected website page" className="max-w-full bg-os-surface2 p-2 text-xs" value={state.pagePath} onChange={e => { const next = e.target.value; setPagePath(next); void action('selectPage', undefined, next); }} disabled={busy || running}>{pages.map(page => <option key={page.path} value={page.path}>{page.title} ({page.path})</option>)}</select>
        <select aria-label="Saved page revision" className="max-w-full bg-os-surface2 p-2 text-xs" value={revision.id} onChange={e => void action('select', e.target.value)} disabled={busy || running}>{state.revisions.filter(item => (item.pagePath ?? state.pagePath) === state.pagePath).map((item, i) => <option key={item.id} value={item.id}>{i + 1}. {item.status} · {item.kind} · {item.attribution?.label || 'system/import'} · {item.createdAt}</option>)}</select>
        <div className="text-xs">Original source protected. Previewing revision {revision.id.slice(0, 8)}.</div>
        <details className="border border-os-border p-3 text-xs">
          <summary>Controlled page manager {revision.document ? `· ${revision.document.sections.length} sections · ${revision.document.templateId}` : '· initialize with your first section'}</summary>
          <p className="my-2 text-os-dim">Creates attributed revisions from approved templates and variants. It never accepts custom CSS or HTML.</p>
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={busy} onClick={() => promptManage('createPage')}>Create page / campaign</button>
            <button className={button} disabled={busy} onClick={() => promptManage('updateSeo')}>Edit SEO</button>
            <button className={button} disabled={busy} onClick={() => promptManage('editSourceText')}>Edit existing copy</button>
            <button className={button} disabled={busy} onClick={() => promptManage('editSourceCta')}>Edit existing CTA</button>
            <button className={button} disabled={busy} onClick={() => promptManage('swapSourceImage')}>Swap existing image</button>
            <select aria-label="Approved template" className="bg-os-surface2 p-2" value={revision.document?.templateId || 'affiliate-magazine'} onChange={e => void manage({ action: 'changeTemplate', templateId: e.target.value })} disabled={busy}>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
            {(['hero', 'rich-text', 'image', 'gallery', 'highlights', 'cards', 'itinerary', 'affiliate', 'faq', 'cta'] as const).map(type => <button key={type} className={button} disabled={busy} onClick={() => void manage({ action: 'addSection', section: { id: `${type}-${Date.now()}`, type, variant: type === 'itinerary' ? 'timeline' : type === 'gallery' || type === 'cards' ? 'grid' : 'standard', heading: type.replace('-', ' '), body: '', items: [], offerIds: [], visible: true } })}>+ {type}</button>)}
          </div>
          {revision.document?.sections.map((section, index) => <div key={section.id} className="mt-2 flex flex-wrap items-center gap-2 border border-os-border p-2">
            <span>{index + 1}. {section.type} · {section.variant}</span>
            <button className={button} disabled={busy || index === 0} onClick={() => void manage({ action: 'reorderSection', sectionId: section.id, index: index - 1 })}>↑</button>
            <button className={button} disabled={busy || index === revision.document!.sections.length - 1} onClick={() => void manage({ action: 'reorderSection', sectionId: section.id, index: index + 1 })}>↓</button>
            <select aria-label={`${section.id} variant`} className="bg-os-surface2 p-2" value={section.variant} onChange={e => void manage({ action: 'editSection', sectionId: section.id, patch: { variant: e.target.value } })}>{['standard', 'centered', 'split', 'grid', 'timeline', 'compact', 'feature'].map(item => <option key={item}>{item}</option>)}</select>
            <button className={button} disabled={busy} onClick={() => { const heading = window.prompt('Section heading', section.heading || ''); if (heading === null) return; const body = window.prompt('Section copy', section.body || ''); if (body === null) return; void manage({ action: 'editSection', sectionId: section.id, patch: { heading, body } }); }}>Edit copy</button>
            <button className={button} disabled={busy} onClick={() => { const label = window.prompt('CTA label', section.cta?.label || ''); if (label === null) return; const href = window.prompt('CTA destination', section.cta?.href || '#'); if (href === null) return; void manage({ action: 'editSection', sectionId: section.id, patch: { cta: label ? { label, href } : undefined } }); }}>Edit CTA</button>
            <button className={button} disabled={busy} onClick={() => { const src = window.prompt('Image URL or imported asset path', section.image?.src || ''); if (src === null) return; const alt = window.prompt('Accessible alt text', section.image?.alt || '') ?? ''; void manage({ action: 'editSection', sectionId: section.id, patch: { image: src ? { src, alt } : undefined } }); }}>Swap image</button>
            <button className={button} disabled={busy} onClick={() => void manage({ action: 'editSection', sectionId: section.id, patch: { visible: !section.visible } })}>{section.visible ? 'Hide' : 'Show'}</button>
            <button className={button} disabled={busy} onClick={() => void manage({ action: 'removeSection', sectionId: section.id })}>Remove</button>
          </div>)}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-os-border pt-3">
            <select aria-label="Approved manual Amazon product" className="min-w-48 bg-os-surface2 p-2" value={affiliateProductId} onChange={e => setAffiliateProductId(e.target.value)}><option value="">Approved manual Amazon product</option>{affiliateProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
            <button className={button} disabled={busy || !affiliateProductId} onClick={() => void manage({ action: 'attachCatalogAffiliate', catalogProductId: affiliateProductId })}>Add Amazon proposal</button>
            <button className={button} disabled={busy} onClick={() => promptManage('schedule')}>Schedule publish/unpublish</button>
            <button className={button} disabled={busy || !state.publishedPages[state.pagePath]} onClick={() => void manage({ action: 'unpublish', pagePath: state.pagePath })}>Unpublish page</button>
          </div>
          {state.schedules.filter(item => item.pagePath === state.pagePath).length > 0 && <div className="mt-3 space-y-2 border-t border-os-border pt-3"><div>Publishing schedule</div>{state.schedules.filter(item => item.pagePath === state.pagePath).map(item => <div key={item.id} className="flex flex-wrap items-center gap-2"><span>{item.action} · {item.scheduledFor} · {item.status} · {item.attribution.label}</span>{item.status === 'scheduled' && <button className={button} disabled={busy} onClick={() => void manage({ action: 'cancelSchedule', scheduleId: item.id })}>Cancel</button>}</div>)}</div>}
        </details>
        {revision.kind === 'agent' && <details className="space-y-2 text-xs"><summary>Revision report: {revision.status} | QA: {revision.qa.status}</summary>
          <p>{revision.qa.summary}</p>
          {revision.affiliateOffers.length > 0 && <div><p>Matched affiliate offers included in preview ({revision.affiliateOffers.length})</p>{revision.affiliateOffers.map(offer => <p key={offer.id}><a href={offer.trackedUrl} rel="sponsored nofollow noopener" target="_blank">{offer.title}</a> | {offer.destination} | {offer.status}</p>)}</div>}
          {([['Content proposals', revision.contentChanges], ['Design proposals', revision.designChanges], ['Media matches', revision.mediaChanges], ['SEO proposals', revision.seo], ['Affiliate proposals', revision.affiliateProposals], ['Warnings', revision.warnings], ['QA checks', revision.qa.checks]] as Array<[string, string[]]>).map(([label, items]) => <details key={label}><summary>{label} ({items.length})</summary><ul className="list-disc space-y-1 pl-4">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></details>)}
          <details><summary>Applied HTML edits ({revision.appliedEdits.length})</summary>{revision.appliedEdits.map((edit, index) => <div key={index} className="my-2 overflow-auto"><div>Before</div><pre className="whitespace-pre-wrap">{edit.before}</pre><div>After</div><pre className="whitespace-pre-wrap">{edit.after}</pre></div>)}</details>
        </details>}
        <textarea aria-label="Page agent request" className="w-full bg-os-surface2 p-2 text-sm" rows={3} value={request} onChange={e => setRequest(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy || running} onClick={() => void action('run')}>Run page specialists</button>
          <button className={button} disabled={busy || running} onClick={() => void action('runAll')}>Process every imported page</button>
          <button className={button} disabled={busy || running} onClick={() => { setHtml(revision.html); setEditing(!editing); }}>Edit a new revision</button>
          <button className={button} disabled={busy || running || !!revision.approvedHash} onClick={() => void action('approve')}>Approve this revision</button>
          <button className={button} disabled={busy || running || revision.status === 'rejected'} onClick={() => void action('reject')}>Reject this revision</button>
          <button className={button} disabled={busy || running || !revision.approvedHash} onClick={() => void action('stage')}>Stage this revision</button>
          <a className={button} target="_blank" rel="noreferrer" href={`/api/website/view/preview/${revision.id}`}>Open exact preview</a>
          {revision.stagedHash && <><a className={button} target="_blank" rel="noreferrer" href="/staging">Open staging</a><button className={button} disabled={busy || running} onClick={() => void action('publish')}>Publish this revision</button></>}
          {state.releases.some(item => item.revisionId === revision.id) && state.publishedId !== revision.id && <button className={button} disabled={busy || running} onClick={() => void action('rollback')}>Roll back to this revision</button>}
          {state.publishedId && <a className={button} href="/site" target="_blank" rel="noreferrer">Open published page</a>}
        </div>
        {editing && <><textarea aria-label="Revision HTML" className="h-80 w-full bg-os-surface2 p-2 font-mono text-xs" value={html} onChange={e => setHtml(e.target.value)} /><button className={button} disabled={busy || running} onClick={() => void action('save')}>Save new revision</button></>}
        {state.releases.length > 0 && <details className="text-xs"><summary>Release history ({state.releases.length})</summary><div className="mt-2 space-y-2">{[...state.releases].reverse().map((release, index) => <div key={`${release.revisionId}-${release.at}-${index}`} className="border border-os-border p-2"><div>{release.action} | {release.at}</div><div>Revision {release.revisionId.slice(0, 8)} | Hash {release.revisionHash?.slice(0, 12) || 'legacy'} | Build {release.build?.slice(0, 12) || 'legacy'}</div>{release.url && <a href={release.url} target="_blank" rel="noreferrer">Open release</a>}</div>)}</div></details>}
      </>}
      {message && <p role="status" className="text-sm">{message}</p>}
      {state && <details className="border-t border-os-border pt-2 text-xs"><summary>Recent agent runs for this page ({state.runs.filter(run => (run.pagePath || state.pagePath) === state.pagePath).length})</summary><div className="mt-2 max-h-72 space-y-2 overflow-auto pr-1">{state.runs.filter(run => (run.pagePath || state.pagePath) === state.pagePath).slice(-8).reverse().map(run => <details key={run.id} className="border border-os-border p-2"><summary className="line-clamp-2">{run.status}: {run.request}</summary>{run.error && <p className="mt-2 text-os-err">{run.error}</p>}{run.results.map((result, index) => <div key={`${result.agentId}-${index}`}><p>{result.agentId}</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap">{result.reply}</pre></div>)}</details>)}</div></details>}
      <div className="text-[10px] text-os-dim">Build {build.slice(0, 12)}</div>
    </div>
    {revision && <iframe key={revision.id} title="Selected saved HTML revision" sandbox="allow-scripts" src={`/api/website/view/preview/${revision.id}`} className="h-[780px] w-full border-0 bg-white" />}
  </section>;
}
