'use client';

import { Check, Eye, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { BrainChat, type BrainCommandResult } from '@/components/BrainChat';
import { BrandingStudio } from '@/components/BrandingStudio';
import { ElementorNativePanel } from '@/components/ElementorNativePanel';
import { ElementorWidgetControls } from '@/components/ElementorWidgetControls';
import { PageHeader } from '@/components/PageHeader';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { TemplateVault } from '@/components/TemplateVault';
import { Badge, SectionHead } from '@/components/terminal';
import { WebsiteBuilderTools } from '@/components/WebsiteBuilderTools';
import { WebsiteCampaignFlow } from '@/components/WebsiteCampaignFlow';
import { WebsiteCommandLibrary, type WebsiteCommand } from '@/components/WebsiteCommandLibrary';
import { WebsiteStructurePanel, WEBSITE_BLOCK_COPY, WEBSITE_BLOCK_LIBRARY } from '@/components/WebsiteStructurePanel';
import { WebsiteTeamPanel } from '@/components/WebsiteTeamPanel';
import { WordPressSiteEditor } from '@/components/WordPressSiteEditor';
import { STYLE_DIRECTIONS, tasteAudit } from '@/lib/design-intelligence';
import type { VaultTemplate } from '@/lib/template-vault';

type BuilderTab = 'build' | 'brand' | 'site' | 'content' | 'review';
type Project = { id?: string; name: string; prompt?: string; direction?: string; page?: { title?: string; blocks?: string[]; generated?: boolean; contentHtml?: string; sourceUrl?: string; wordpressId?: number } };

const DEFAULT_BLOCKS = ['Hero', 'Social proof', 'Feature grid', 'Offer / CTA', 'FAQ', 'Footer'];
const TABS: Array<{ id: BuilderTab; label: string; description: string }> = [
  { id: 'build', label: 'Build', description: 'Describe, generate, refine' },
  { id: 'brand', label: 'Brand Studio', description: 'Identity, vault, templates' },
  { id: 'site', label: 'Connect a site', description: 'WordPress and Elementor' },
  { id: 'content', label: 'Content & assets', description: 'Projects, files, structure' },
  { id: 'review', label: 'Review & export', description: 'Quality and handoff' },
];

export default function WebsiteBuilderPage() {
  const [activeTab, setActiveTab] = useState<BuilderTab>('build');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('Your new website');
  const [generated, setGenerated] = useState(false);
  const [aiStatus, setAiStatus] = useState('Ready for a brief');
  const [direction, setDirection] = useState('editorial');
  const [projectId, setProjectId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [assetFolder, setAssetFolder] = useState('general');
  const [uploadStatus, setUploadStatus] = useState('');
  const [elementorPreviewUrl, setElementorPreviewUrl] = useState('https://letstalkmilesandtravel.com/');
  const [elementorEditorUrl, setElementorEditorUrl] = useState('');
  const [livePreviewMode, setLivePreviewMode] = useState<'page' | 'elementor'>('page');
  const [previewLayout, setPreviewLayout] = useState<'panel' | 'tabs'>('panel');
  const [showConnectedPage, setShowConnectedPage] = useState(false);
  const [importedContent, setImportedContent] = useState('');

  const audit = tasteAudit({ title, sections: blocks.length, cta: 'See how it works', direction });

  function applyCommand(command: WebsiteCommand) {
    setPrompt(selectedTemplate ? `${command.prompt} The selected template is ${selectedTemplate}.` : command.prompt);
    setGenerated(false);
    setAiStatus(`${command.label} selected · ready to build`);
  }

  function applyTemplate(template: VaultTemplate) {
    setSelectedTemplate(template.name);
    setPrompt(`Use the ${template.name} template as the structural starting point. ${template.description} Preserve its ${template.styles.join(', ')} direction and build the complete site using ${template.components.join(', ')}.`);
    setBlocks(template.components);
    setGenerated(false);
    setAiStatus(`${template.name} selected · ready to build`);
  }

  function loadProject(project: Project) {
    setProjectId(project.id);
    setTitle(project.page?.title || project.name);
    setPrompt(project.prompt || '');
    setDirection(project.direction || 'editorial');
    setBlocks(project.page?.blocks?.length ? project.page.blocks : DEFAULT_BLOCKS);
    setGenerated(Boolean(project.page?.generated));
    setImportedContent(project.page?.contentHtml || '');
    if (project.page?.sourceUrl) {
      setElementorPreviewUrl(project.page.sourceUrl);
      setLivePreviewMode('page');
      if (project.page.wordpressId) {
        try { setElementorEditorUrl(`${new URL(project.page.sourceUrl).origin}/wp-admin/post.php?post=${project.page.wordpressId}&action=elementor`); }
        catch { setElementorEditorUrl(''); }
      }
    }
    setActiveTab('build');
    setAiStatus('Project loaded · ready to refine');
  }

  function handleElementorPageSelected(selection: { previewUrl: string; editUrl?: string; openInElementor?: boolean }) {
    setElementorPreviewUrl(selection.previewUrl);
    setElementorEditorUrl(selection.editUrl || '');
    setLivePreviewMode(selection.openInElementor && selection.editUrl ? 'elementor' : 'page');
    setPreviewLayout('tabs');
    setShowConnectedPage(true);
    setActiveTab('site');
  }

  async function generatePage(request = prompt) {
    const cleanRequest = request.trim();
    if (!cleanRequest) { setAiStatus('Describe the website before generating'); return; }
    setAiStatus('Building your complete draft…');
    try {
      const brandResponse = await fetch('/api/brand?workspace=default', { cache: 'no-store' });
      const brandBody = await brandResponse.json().catch(() => ({}));
      const blueprint = brandBody.brand?.blueprint as { businessName?: string; voice?: string; visualDirection?: string; frontendTemplateId?: string; fullStackTemplateId?: string } | undefined;
      const brandInstruction = blueprint ? `\nUse the saved Brand Studio blueprint for ${blueprint.businessName || 'this business'}. Voice: ${blueprint.voice || 'approved brand voice'}. Visual direction: ${blueprint.visualDirection || 'approved visual direction'}. Template foundations: ${blueprint.frontendTemplateId || 'front-end'}, ${blueprint.fullStackTemplateId || 'full-stack'}.` : '';
      const response = await fetch('/api/ai/design-brief', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: `${cleanRequest}${brandInstruction}`, direction }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.brief) throw new Error(body.error || 'Generation failed');
      const brief = body.brief as { title?: string; sections?: unknown[] };
      const nextBlocks = Array.isArray(brief.sections) ? brief.sections.filter((section): section is string => typeof section === 'string' && Boolean(section.trim())).slice(0, 12) : [];
      if (brief.title) setTitle(brief.title);
      if (nextBlocks.length) setBlocks(nextBlocks);
      setGenerated(true);
      setAiStatus(`${body.mode === 'live' ? 'AI' : 'Demo'} draft ready · review the preview`);
    } catch (error) { setAiStatus(error instanceof Error ? error.message : 'Generation failed'); }
  }

  async function handleCopilotCommand(message: string): Promise<BrainCommandResult | null> {
    const normalized = message.toLowerCase();
    const requestedBlock = WEBSITE_BLOCK_LIBRARY.find((block) => normalized.includes(block.toLowerCase()));
    if (requestedBlock && /\b(add|insert|include|restore|put)\b/.test(normalized)) {
      if (blocks.includes(requestedBlock)) return { handled: true, message: `${requestedBlock} is already in the working structure. Tell me if you want it moved or redesigned.` };
      setBlocks((current) => [...current, requestedBlock]);
      setAiStatus(`${requestedBlock} added to the working structure`);
      return { handled: true, message: `I added the ${requestedBlock} section to the working structure. Review it in “Arrange the page,” then regenerate the draft if you want the copy and layout refreshed.` };
    }
    if (requestedBlock && /\b(remove|delete|drop)\b/.test(normalized)) {
      if (!blocks.includes(requestedBlock)) return { handled: true, message: `${requestedBlock} is not currently in the working structure.` };
      setBlocks((current) => current.filter((block) => block !== requestedBlock));
      setAiStatus(`${requestedBlock} removed from the working structure`);
      return { handled: true, message: `I removed the ${requestedBlock} section from the working structure. The connected WordPress site was not changed.` };
    }
    if (/\b(generate|build|create|redesign|redo|rewrite|refresh)\b/.test(normalized)) {
      await generatePage(message);
      return { handled: true, message: `I used your instruction to update the working website draft. Review the preview and structure before saving or exporting; nothing was published.` };
    }
    return null;
  }

  const safeImportedContent = importedContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  const builderChatContext = `Website Builder project context. Current draft: ${title}. Template: ${selectedTemplate || 'not selected'}. Active sections: ${blocks.join(', ')}. Direction: ${direction}. Imported WordPress content: ${importedContent ? 'yes' : 'no'}. Use G-Brain memory, the Conductor, and the best website, brand, content, SEO, accessibility, and social agents. Help the operator create or refine the complete travel-business website. Do not publish, delete, or change external systems without explicit approval.`;

  const draftPreview = <div className="min-h-[680px] bg-[#f4f0e7] px-[8%] py-14 text-[#1c211d]"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between text-[11px] font-bold tracking-[0.14em]"><span>{importedContent ? 'WORDPRESS / LOCAL DRAFT' : 'BUSINESS OS / WORKING DRAFT'}</span>{importedContent && <span className="rounded-full border border-[#1c211d]/20 px-3 py-1 text-[9px]">IMPORTED FOR REVIEW</span>}</div><div className="mt-20 max-w-2xl"><div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#718074]">{selectedTemplate ? `Template · ${selectedTemplate}` : 'AI website draft'}</div><input aria-label="Draft title" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full bg-transparent font-serif text-[clamp(42px,6vw,78px)] leading-[0.94] tracking-[-0.05em] outline-none" />{importedContent ? <div className="prose mt-8 max-w-none text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: safeImportedContent }} /> : <><p className="mt-8 max-w-lg text-[17px] leading-relaxed text-[#566159]">{generated ? 'Your complete working draft is ready. Refine the structure, content, and conversion path before export.' : 'Your website preview will appear here. Start with a command or describe what you want to build.'}</p><button type="button" onClick={() => void generatePage()} className="mt-9 rounded-full bg-[#1c211d] px-6 py-3 text-[12px] font-bold text-[#f4f0e7]">{generated ? 'Regenerate draft' : 'Generate draft'} ↗</button></>}</div><div className="mt-28 grid grid-cols-3 gap-3 border-t border-[#1c211d]/15 pt-5 text-[10px] uppercase tracking-[0.12em] text-[#718074]"><span>Structure</span><span>Content</span><span>Conversion</span></div><div className="mt-14 space-y-3 border-t border-[#1c211d]/15 pt-5">{blocks.filter((block) => block !== 'Hero').map((block, index) => <section key={`${block}-${index}`} className="border border-[#1c211d]/15 p-4"><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#718074]">{String(index + 1).padStart(2, '0')} · {block}</div><p className="mt-2 max-w-xl text-[14px] leading-6 text-[#566159]">{WEBSITE_BLOCK_COPY[block] || 'Shape this section around the page goal and the visitor’s next best action.'}</p></section>)}</div></div></div>;

  const connectedPreview = showConnectedPage && <section className="overflow-hidden border border-os-border bg-os-surface"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-border px-4 py-3"><div><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-os-accent">{livePreviewMode === 'elementor' ? 'Elementor editor in workspace' : 'Connected WordPress page'}</div><div className="mt-1 text-[11px] text-os-muted">{livePreviewMode === 'elementor' ? 'Edit the selected page while Business OS stays available around it.' : 'Read-only preview. Switch to Elementor when the editor URL is available.'}</div></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setLivePreviewMode('page')} className={`border px-3 py-2 font-mono text-[10px] uppercase ${livePreviewMode === 'page' ? 'border-[var(--accent-line)] text-os-accent' : 'border-os-border text-os-muted'}`}>Regular page</button><button type="button" onClick={() => setLivePreviewMode('elementor')} disabled={!elementorEditorUrl} className={`border px-3 py-2 font-mono text-[10px] uppercase ${livePreviewMode === 'elementor' ? 'border-[var(--accent-line)] text-os-accent' : 'border-os-border text-os-muted'} disabled:opacity-40`}>Elementor editor</button><button type="button" onClick={() => setShowConnectedPage(false)} className="border border-os-border px-3 py-2 font-mono text-[10px] uppercase text-os-accent">Back to draft</button></div></div><div className="relative h-[720px] bg-white"><iframe title={livePreviewMode === 'elementor' ? 'Elementor editor for selected WordPress page' : 'Selected WordPress page preview'} src={livePreviewMode === 'elementor' && elementorEditorUrl ? elementorEditorUrl : elementorPreviewUrl} className={`h-full w-full border-0 ${livePreviewMode === 'page' ? 'pointer-events-none' : ''}`} />{livePreviewMode === 'page' && <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-center bg-black/75 px-3 font-mono text-[9px] uppercase tracking-[0.08em] text-white">Read-only preview</div>}</div></section>;

  return <div className="pb-12"><PageHeader eyebrow="creative / web" title="Website Builder" right={<Badge tone="ok">● AI design workspace</Badge>} /><div className="mx-auto max-w-[1700px] px-4 sm:px-6"><section className="mb-5 border-b border-os-border pb-5 pt-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-os-accent">Template-first website creation</div><h1 className="mt-2 max-w-3xl font-serif text-[clamp(30px,4vw,52px)] leading-[0.98] tracking-[-0.04em]">Describe it once. Let the right agents shape the whole site.</h1><p className="mt-3 max-w-2xl text-[14px] leading-6 text-os-muted">Start with a proven structure, talk to the brain, and review a complete draft before anything reaches WordPress or social channels.</p></div><div className="flex items-center gap-2 text-[11px] text-os-muted"><span className="h-2 w-2 rounded-full bg-os-ok" /> {aiStatus}</div></div></section><nav aria-label="Website Builder work areas" className="mb-6 grid gap-2 border-b border-os-border pb-4 sm:grid-cols-2 xl:grid-cols-4">{TABS.map((tab, index) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`group flex items-start gap-3 border p-3 text-left transition-colors ${activeTab === tab.id ? 'border-[var(--accent-line)] bg-os-accent/10' : 'border-os-border bg-os-surface hover:border-os-accent/50'}`}><span className={`font-mono text-[11px] ${activeTab === tab.id ? 'text-os-accent' : 'text-os-dim'}`}>0{index + 1}</span><span><span className={`block text-[13px] font-semibold ${activeTab === tab.id ? 'text-os-accent' : 'text-os-copy'}`}>{tab.label}</span><span className="mt-1 block text-[11px] leading-4 text-os-muted">{tab.description}</span></span></button>)}</nav>

      {activeTab === 'brand' && <div className="space-y-5"><BrandingStudio compact /><WebsiteTeamPanel /></div>}

      {activeTab === 'build' && <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"><aside className="space-y-4"><section className="border border-os-accent/40 bg-os-accent/5 p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">Step 1 · Describe</div><h2 className="mt-2 text-[18px] font-semibold">What are we making?</h2><p className="mt-2 text-[12px] leading-5 text-os-muted">Tell the agents what the site must do. Include the audience, offer, pages, tone, and visual references.</p><textarea aria-label="Website brief" value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-4 min-h-44 w-full resize-y border border-os-border bg-os-surface px-3 py-3 text-[13px] leading-6 outline-none focus:border-[var(--accent-line)]" placeholder="Describe the site, audience, offer, and visual direction…" /><button type="button" onClick={() => void generatePage()} className="mt-3 flex w-full items-center justify-center gap-2 bg-os-accent px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-ink)]"><Wand2 className="h-3.5 w-3.5" /> Generate complete draft</button></section><WebsiteCommandLibrary onSelect={applyCommand} /><details className="border border-os-border bg-os-surface"><summary className="cursor-pointer px-4 py-3 text-[13px] font-semibold">Choose a template <span className="ml-1 font-mono text-[10px] text-os-dim">approved starting points</span></summary><div className="border-t border-os-border p-3"><TemplateVault onSelect={applyTemplate} /></div></details><details className="border border-os-border bg-os-surface"><summary className="cursor-pointer px-4 py-3 text-[13px] font-semibold">Choose visual direction</summary><div className="space-y-2 border-t border-os-border p-3">{STYLE_DIRECTIONS.map((style) => <button key={style.id} type="button" onClick={() => setDirection(style.id)} className={`w-full border p-3 text-left ${direction === style.id ? 'border-[var(--accent-line)] bg-os-accent/10' : 'border-os-border hover:bg-os-surface2'}`}><div className="text-[12px] font-semibold">{style.name}</div><div className="mt-1 text-[10px] leading-4 text-os-muted">{style.rule}</div></button>)}</div></details></aside><div className="min-w-0 space-y-5"><div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]"><main className="min-w-0 overflow-hidden border border-os-border bg-os-surface"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-os-border px-4 py-3"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-os-accent"><Eye className="h-3.5 w-3.5" /> Step 2 · Working preview</div><span className="font-mono text-[10px] text-os-muted">{generated ? 'Draft generated · editable' : 'Preview updates as you refine'}</span></div>{draftPreview}</main><aside className="min-w-0 space-y-5"><BrainChat context={builderChatContext} heading="Website Builder command center" description="Ask the AI to build, redesign, arrange sections, import WordPress content, or coordinate the right agents. Your chat is saved." badge="CONDUCTOR · G-BRAIN · WEBSITE SKILLS" quickPrompts={['Build the complete travel site', 'Redesign this draft', 'Add an FAQ section', 'Import my WordPress pages']} onCommand={handleCopilotCommand} inputPlaceholder="Tell the AI exactly what to change…" className="min-h-[680px]" /><section className="border border-os-border bg-os-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-dim">Build status</div><div className="mt-4 space-y-3">{[['Template', selectedTemplate || 'Not selected'], ['Sections', `${blocks.length} active`], ['Brand review', audit.score >= 80 ? 'Ready' : 'Needs review'], ['Publishing', 'Approval required']].map(([label, value]) => <div key={label} className="border-b border-os-border pb-3 last:border-0 last:pb-0"><div className="text-[11px] text-os-muted">{label}</div><div className="mt-1 text-[13px] font-semibold">{value}</div></div>)}</div></section><WebsiteBuilderTools projectId={projectId} prompt={prompt} title={title} direction={direction} blocks={blocks} generated={generated} /></aside></div><details open className="border border-os-border bg-os-surface"><summary className="cursor-pointer px-4 py-3 text-[13px] font-semibold">Step 3 · Arrange the page <span className="ml-1 font-mono text-[10px] text-os-dim">drag and drop sections</span></summary><div className="border-t border-os-border p-3"><WebsiteStructurePanel blocks={blocks} onChange={setBlocks} compact /></div></details><WebsiteCampaignFlow onPrepareWebsite={async (campaignPrompt) => { setPrompt(campaignPrompt); await generatePage(campaignPrompt); }} /></div></div>}

      {activeTab === 'site' && <div className="space-y-5"><section className="border border-os-border bg-os-surface p-4"><div className="flex flex-col justify-between gap-2 md:flex-row md:items-center"><div><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-os-accent">Connect a live site</div><p className="mt-2 text-[13px] leading-5 text-os-muted">Select a WordPress page, inspect it here, and open Elementor in this workspace when the connection allows it.</p></div><div className="font-mono text-[10px] text-os-dim">{elementorEditorUrl ? 'Elementor edit URL ready' : 'Select a page to enable Elementor'}</div></div></section><WordPressSiteEditor onElementorPageSelected={handleElementorPageSelected} /><ElementorNativePanel /><ElementorWidgetControls />{connectedPreview || <div className="border border-dashed border-os-border-strong p-10 text-center text-[13px] text-os-muted">Select a WordPress page above to load its preview here.</div>}</div>}

      {activeTab === 'content' && <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]"><aside className="space-y-4"><section className="border border-os-border bg-os-surface p-4"><SectionHead label="Saved projects" /><ProjectSwitcher onLoad={loadProject} /></section><section className="border border-os-border bg-os-surface p-4"><SectionHead label="Asset library" count="local folder" /><select value={assetFolder} onChange={(event) => setAssetFolder(event.target.value)} className="mb-2 w-full border border-os-border bg-os-surface2 px-2 py-2 font-mono text-[10px] uppercase"><option value="general">General</option><option value="brand">Brand</option><option value="website">Website</option><option value="social">Social</option><option value="client">Client files</option></select><label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-os-border-strong px-3 py-4 font-mono text-[10px] uppercase text-os-accent hover:bg-os-surface2"><Sparkles className="h-3.5 w-3.5" /> Upload images or files<input type="file" multiple className="hidden" onChange={async (event) => { const files = Array.from(event.target.files ?? []); for (const file of files) { const body = new FormData(); body.append('file', file); body.append('folder', assetFolder); const response = await fetch('/api/assets', { method: 'POST', body }); if (response.ok) setUploadStatus(`${files.length} file${files.length === 1 ? '' : 's'} saved to ${assetFolder}`); } event.target.value = ''; }} /></label>{uploadStatus && <div className="mt-2 font-mono text-[10px] text-os-ok">✓ {uploadStatus}</div>}<div className="mt-2 text-[10px] leading-4 text-os-dim">Use original or rights-cleared assets. Uploads stay in local data/assets.</div></section></aside><WebsiteStructurePanel blocks={blocks} onChange={setBlocks} /></div>}

      {activeTab === 'review' && <div className="space-y-5"><WebsiteTeamPanel /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="border border-os-border bg-os-surface p-5"><div className="flex items-center justify-between"><SectionHead label="Full quality review" count={`${audit.score}/100`} /><span className="font-mono text-[10px] text-os-muted">{generated ? 'Draft ready for review' : 'Generate a draft to begin'}</span></div><div className="mt-4 divide-y divide-os-border">{audit.checks.map(({ label, pass }) => <div key={label} className="flex items-center justify-between py-4"><span className="text-[13px]">{label}</span><span className={`flex items-center gap-2 font-mono text-[10px] uppercase ${pass ? 'text-os-ok' : 'text-os-warn'}`}>{pass ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}{pass ? 'Pass' : 'Review'}</span></div>)}</div><div className="mt-5 border-t border-os-border pt-4 text-[12px] leading-5 text-os-muted">Publishing remains approval-gated. Confirm the page tree, content, image rights, disclosures, and mobile layout before sending changes to WordPress or social platforms.</div></section><aside className="space-y-4"><WebsiteBuilderTools projectId={projectId} prompt={prompt} title={title} direction={direction} blocks={blocks} generated={generated} /><section className="border border-os-border bg-os-surface p-4"><SectionHead label="Preview behavior" /><div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => setPreviewLayout('panel')} aria-pressed={previewLayout === 'panel'} className={`border px-3 py-2 font-mono text-[10px] uppercase ${previewLayout === 'panel' ? 'border-[var(--accent-line)] text-os-accent' : 'border-os-border text-os-muted'}`}>Panel</button><button type="button" onClick={() => setPreviewLayout('tabs')} aria-pressed={previewLayout === 'tabs'} className={`border px-3 py-2 font-mono text-[10px] uppercase ${previewLayout === 'tabs' ? 'border-[var(--accent-line)] text-os-accent' : 'border-os-border text-os-muted'}`}>Tabs</button></div><p className="mt-3 text-[11px] leading-5 text-os-muted">The connected-site preview stays available when you change work areas. It closes only when you return to the draft or select a new site.</p></section></aside></div></div>}
    </div></div>;
}
