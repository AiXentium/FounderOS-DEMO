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
    const timer = setInterval(() => void refresh().catch(() => undefined), 4000);
    return () => clearInterval(timer);
  }, [projectId]);
  const revision = state?.revisions.find(item => item.id === state.selectedId);
  const action = async (name: string, revisionId = revision?.id) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/website/lifecycle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: name, projectId, version: state?.version ?? 0, pagePath, revisionId, request, ...(name === 'save' ? { html } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Request failed.');
      setState(body.state); setMessage(body.jobId ? 'Page work queued. Results will appear here.' : `${name === 'canonical' ? 'Canonical page selected' : name.charAt(0).toUpperCase() + name.slice(1) + ' saved'}.`);
      if (name === 'save') setEditing(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Request failed.'); await refresh().catch(() => undefined); }
    finally { setBusy(false); }
  };
  const button = 'border border-os-border px-3 py-2 text-xs disabled:opacity-40';
  const running = state?.runs.some(item => item.status === 'running');
  if (state && state.projectId !== projectId) return <div className="p-4 text-os-text">This duplicate is not the canonical project. Load project {state.projectId} from Saved Projects to continue the pilot.</div>;
  return <section className="min-w-0 bg-os-surface text-os-text">
    <div className="space-y-3 border-b border-os-border p-4">
      <div className="text-xs">{state ? `Canonical page: ${state.pagePath}` : 'Choose the canonical project and one pilot page'}</div>
      {!state && <><select aria-label="Pilot page" className="max-w-full bg-os-surface2 p-2 text-xs" value={pagePath} onChange={e => setPagePath(e.target.value)}>{pages.map(page => <option key={page.path} value={page.path}>{page.title} ({page.path})</option>)}</select><button className={button} disabled={busy || !pagePath} onClick={() => void action('canonical')}>Use this project and page</button></>}
      {state && revision && <>
        <select aria-label="Saved page revision" className="max-w-full bg-os-surface2 p-2 text-xs" value={revision.id} onChange={e => void action('select', e.target.value)} disabled={busy || running}>{state.revisions.map((item, i) => <option key={item.id} value={item.id}>{i + 1}. {item.kind} - {item.createdAt} {item.approvedHash ? '(approved)' : ''}</option>)}</select>
        <div className="text-xs">Original source protected. Previewing revision {revision.id.slice(0, 8)}.</div>
        {revision.kind === 'agent' && <details className="space-y-2 text-xs" open><summary>Revision report: {revision.status} | QA: {revision.qa.status}</summary>
          <p>{revision.qa.summary}</p>
          {([['Content proposals', revision.contentChanges], ['Design proposals', revision.designChanges], ['Media matches', revision.mediaChanges], ['SEO proposals', revision.seo], ['Affiliate proposals', revision.affiliateProposals], ['Warnings', revision.warnings], ['QA checks', revision.qa.checks]] as Array<[string, string[]]>).map(([label, items]) => <details key={label}><summary>{label} ({items.length})</summary><ul className="list-disc space-y-1 pl-4">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></details>)}
          <details><summary>Applied HTML edits ({revision.appliedEdits.length})</summary>{revision.appliedEdits.map((edit, index) => <div key={index} className="my-2 overflow-auto"><div>Before</div><pre className="whitespace-pre-wrap">{edit.before}</pre><div>After</div><pre className="whitespace-pre-wrap">{edit.after}</pre></div>)}</details>
        </details>}
        <textarea aria-label="Page agent request" className="w-full bg-os-surface2 p-2 text-sm" rows={3} value={request} onChange={e => setRequest(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy || running} onClick={() => void action('run')}>Run page specialists</button>
          <button className={button} disabled={busy || running} onClick={() => { setHtml(revision.html); setEditing(!editing); }}>Edit a new revision</button>
          <button className={button} disabled={busy || running || !!revision.approvedHash} onClick={() => void action('approve')}>Approve this revision</button>
          <button className={button} disabled={busy || running || !revision.approvedHash} onClick={() => void action('stage')}>Stage this revision</button>
          {revision.stagedHash && <><a className={button} target="_blank" rel="noreferrer" href={`/api/website/view/staging/${revision.id}`}>Open staging</a><button className={button} disabled={busy || running} onClick={() => void action('publish')}>Publish this revision</button></>}
          {state.releases.some(item => item.revisionId === revision.id) && state.publishedId !== revision.id && <button className={button} disabled={busy || running} onClick={() => void action('rollback')}>Roll back to this revision</button>}
          {state.publishedId && <a className={button} href="/api/website/view/live/current" target="_blank" rel="noreferrer">Open published page</a>}
        </div>
        {editing && <><textarea aria-label="Revision HTML" className="h-80 w-full bg-os-surface2 p-2 font-mono text-xs" value={html} onChange={e => setHtml(e.target.value)} /><button className={button} disabled={busy || running} onClick={() => void action('save')}>Save new revision</button></>}
      </>}
      {message && <p role="status" className="text-sm">{message}</p>}
      {state?.runs.map(run => <details key={run.id} className="text-xs"><summary>{run.status}: {run.request} {run.error}</summary>{run.results.map((result, index) => <div key={`${result.agentId}-${index}`}><p>{result.agentId}</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap">{result.reply}</pre></div>)}</details>)}
      <div className="text-[10px] text-os-dim">Build {build.slice(0, 12)}</div>
    </div>
    {revision && <iframe key={revision.id} title="Selected saved HTML revision" sandbox="allow-scripts" src={`/api/website/view/preview/${revision.id}`} className="h-[780px] w-full border-0 bg-white" />}
  </section>;
}
