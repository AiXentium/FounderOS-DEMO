import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { getBrainProvider } from '@/lib/brain';
import { chat as llmChat } from '@/lib/connectors/llm';
import { runtimeEnv } from '@/lib/creds';
import { generateWithGemini, openPageGeminiStatus } from '@/lib/openpage-gemini';
import { OPENPAGE_TEMPLATE_WORKSPACE, OPENPAGE_WORKSPACE, defaultOpenPageDocument, normalizeOpenPageDocument, openPageMemoryText, openPageSlug, renderOpenPageHtml, type OpenPageDocument } from '@/lib/openpage';
import { scrapeWebsite, type ScrapedSiteAnalysis } from '@/lib/openpage-scraper';
import { wordPressProvider } from '@/lib/wordpress-provider';
import type { WordPressPage, WordPressPost } from '@/lib/wordpress-client';

export const dynamic = 'force-dynamic';

const DocumentSchema = z.record(z.unknown());
const SaveSchema = z.object({
  action: z.literal('save'),
  id: z.string().optional(),
  name: z.string().min(1),
  prompt: z.string().default(''),
  document: DocumentSchema,
  sourceAnalysis: DocumentSchema.optional(),
});

function asScrapedAnalysis(value: unknown): ScrapedSiteAnalysis | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Partial<ScrapedSiteAnalysis>;
  if (typeof input.sourceUrl !== 'string' || typeof input.siteName !== 'string' || !Array.isArray(input.pages) || !input.brand || !input.layout) return undefined;
  return input as ScrapedSiteAnalysis;
}

function templateDocument(analysis: ScrapedSiteAnalysis): OpenPageDocument {
  const starter = defaultOpenPageDocument(`${analysis.siteName} · Imported style template`);
  const first = analysis.pages[0];
  const pageHeadings = analysis.pages.flatMap((page) => page.headings).filter(Boolean).slice(0, 3);
  const colors = analysis.brand.colors;
  const displayFont = analysis.brand.fonts.find((font) => !/sans-serif|system-ui|apple-system|inherit|monospace/i.test(font)) || starter.theme.displayFont;
  const bodyFont = analysis.brand.fonts.find((font) => /sans|system|arial|roboto|helvetica/i.test(font)) || starter.theme.bodyFont;
  return normalizeOpenPageDocument({
    ...starter,
    name: `${analysis.siteName} · Imported style template`,
    description: `A reusable OpenPage template extracted from ${analysis.sourceUrl}.`,
    theme: { ...starter.theme, background: analysis.brand.backgroundColor, text: analysis.brand.textColor, accent: analysis.brand.accentColor, displayFont, bodyFont },
    metadata: { purpose: 'Preserve the source brand while improving clarity, hierarchy, and conversion.', audience: 'Visitors to the imported website.', source: `OpenPage website scan · ${analysis.sourceUrl}` },
    blocks: [
      { id: 'imported-nav', type: 'navbar', label: 'Imported navigation', props: { brand: analysis.siteName, logoUrl: analysis.brand.logoUrl, links: analysis.layout.navLabels.length ? analysis.layout.navLabels : ['Home', 'About', 'Contact'] } },
      { id: 'imported-hero', type: 'hero', label: 'Imported hero', props: { eyebrow: 'IMPORTED BRAND SYSTEM', headline: first?.headings[0] || first?.title || analysis.siteName, subheadline: first?.description || first?.text || 'A cleaner, more useful version of the original site.', cta: 'Explore', secondaryCta: 'Learn more' } },
      ...(analysis.brand.ogImageUrl || first?.images[0] ? [{ id: 'imported-image', type: 'image' as const, label: 'Imported lead image', props: { src: analysis.brand.ogImageUrl || first?.images[0], alt: `${analysis.siteName} visual`, caption: 'Imported visual direction from the source site.' } }] : []),
      { id: 'imported-features', type: 'features', label: 'Imported content map', props: { heading: 'Organize the site around what visitors need.', items: pageHeadings.length ? pageHeadings : analysis.pages.slice(0, 3).map((page) => page.title) } },
      { id: 'imported-content', type: 'content', label: 'Source content', props: { eyebrow: 'SOURCE CONTENT', heading: 'Keep the point of view. Remove the friction.', body: first?.text || 'The source content is ready for an editorial redesign.' } },
      { id: 'imported-stats', type: 'stats', label: 'Scan signals', props: { items: [{ value: String(analysis.pagesScanned), label: 'pages scanned' }, { value: String(analysis.layout.imageCount), label: 'images found' }, { value: String(colors.length), label: 'brand colors' }] } },
      { id: 'imported-cta', type: 'cta', label: 'Improved call to action', props: { heading: 'Give every visitor a clear next step.', body: 'Review the redesign suggestions, refine the draft, and approve the version you want to publish.', cta: 'Review redesign' } },
      { id: 'imported-footer', type: 'footer', label: 'Imported footer', props: { text: `${analysis.siteName} · OpenPage redesign draft` } },
    ],
  }, `${analysis.siteName} template`);
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start < 0 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(fenced.slice(start, end + 1));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
  } catch { return undefined; }
}

async function getPrimaryWordPressClient() {
  const env = runtimeEnv();
  if (!wordPressProvider.getSite('primary') && env.WORDPRESS_URL && env.WORDPRESS_USERNAME && env.WORDPRESS_APP_PASSWORD) {
    await wordPressProvider.registerSite({ siteId: 'primary', siteName: 'Primary WordPress site', siteUrl: env.WORDPRESS_URL, username: env.WORDPRESS_USERNAME, appPassword: env.WORDPRESS_APP_PASSWORD, enabled: true });
  }
  const client = wordPressProvider.getSite('primary');
  if (!client) throw new Error('WordPress is not configured. Add WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD to the server environment.');
  return { client, siteUrl: env.WORDPRESS_URL || '' };
}

async function listAllWordPressContent<T extends { id: number }>(list: (page: number) => Promise<{ items: T[]; totalPages: number }>) {
  const items: T[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await list(page);
    items.push(...result.items);
    if (!result.items.length || page >= Math.max(result.totalPages, 1)) break;
  }
  return items;
}

function plainText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#039;|&#39;/gi, "'").replace(/\s+/g, ' ').trim();
}

function wordpressDocument(item: WordPressPage | WordPressPost, siteUrl: string): OpenPageDocument {
  const title = plainText(item.title?.rendered || item.slug || `WordPress ${item.id}`);
  const body = plainText(item.content?.rendered || item.excerpt?.rendered || 'This WordPress page is ready to refine in the OpenPage editor.');
  const starter = defaultOpenPageDocument(title);
  return normalizeOpenPageDocument({
    ...starter,
    name: title,
    description: body.slice(0, 280) || starter.description,
    metadata: { ...starter.metadata, purpose: `Edit the WordPress ${item.type} “${title}” in OpenPage.`, source: `WordPress import · ${siteUrl}${item.link || ''}` },
    blocks: [
      { id: 'wp-nav', type: 'navbar', label: 'WordPress navigation', props: { brand: siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''), links: ['Home', 'About', 'Contact'] } },
      { id: 'wp-hero', type: 'hero', label: `${item.type === 'post' ? 'Post' : 'Page'} hero`, props: { eyebrow: item.type === 'post' ? 'WORDPRESS POST' : 'WORDPRESS PAGE', headline: title, subheadline: body.slice(0, 420) || 'A WordPress page ready for a clearer, more useful design.', cta: 'Read more', secondaryCta: 'Explore' } },
      { id: 'wp-content', type: 'content', label: 'Imported WordPress content', props: { eyebrow: 'IMPORTED CONTENT', heading: title, body: body || 'Add the page copy here, then ask OpenPage AI to improve the structure.' } },
      { id: 'wp-footer', type: 'footer', label: 'WordPress footer', props: { text: `${siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')} · OpenPage draft` } },
    ],
  }, title);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'projects';
  const db = getDb();
  if (action === 'context') {
    const query = url.searchParams.get('query')?.trim() || 'OpenPage website drafts';
    const results = (await getBrainProvider().search(query)).filter((item) => item.title.toLowerCase().startsWith('openpage/'));
    return NextResponse.json({ ok: true, workspace: OPENPAGE_WORKSPACE, results });
  }
  if (action === 'templates') {
    const templates = db.websiteProjects.all(OPENPAGE_TEMPLATE_WORKSPACE).map((project: any) => ({ id: project.id, name: project.name, updatedAt: project.updated_at, document: normalizeOpenPageDocument(project.page, project.name) }));
    return NextResponse.json({ ok: true, workspace: OPENPAGE_TEMPLATE_WORKSPACE, templates, memoryVault: 'G-Brain · openpage/templates/' });
  }
  if (action === 'site-pages') {
    try {
      const { client, siteUrl } = await getPrimaryWordPressClient();
      const [pages, posts] = await Promise.all([
        listAllWordPressContent((page) => client.listPages({ page, per_page: 100 })),
        listAllWordPressContent((page) => client.listPosts({ page, per_page: 100 })),
      ]);
      const pageNodes = pages.map((page) => ({ id: `page-${page.id}`, wpId: page.id, kind: 'page' as const, title: plainText(page.title?.rendered || page.slug), slug: page.slug, url: page.link, status: page.status, parent: page.parent, children: [] as unknown[] }));
      const roots: typeof pageNodes = [];
      for (const node of pageNodes) {
        const parent = pageNodes.find((candidate) => candidate.wpId === node.parent);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
      const postNodes = posts.map((post) => ({ id: `post-${post.id}`, wpId: post.id, kind: 'post' as const, title: plainText(post.title?.rendered || post.slug), slug: post.slug, url: post.link, status: post.status, parent: 0, children: [] as unknown[] }));
      return NextResponse.json({ ok: true, siteUrl, nodes: [{ id: 'wordpress-pages', title: 'Pages', kind: 'folder', children: roots }, { id: 'wordpress-posts', title: 'Blog posts', kind: 'folder', children: postNodes }], counts: { pages: pages.length, posts: posts.length } });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 502 });
    }
  }
  if (action === 'site-page') {
    const id = Number(url.searchParams.get('id'));
    const kind = url.searchParams.get('kind') === 'post' ? 'post' : 'page';
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ ok: false, error: 'A valid WordPress page id is required.' }, { status: 400 });
    try {
      const { client, siteUrl } = await getPrimaryWordPressClient();
      const item = kind === 'post' ? await client.getPost(id) : await client.getPage(id);
      return NextResponse.json({ ok: true, kind, item, document: wordpressDocument(item, siteUrl) });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 502 });
    }
  }
  const projects = db.websiteProjects.all(OPENPAGE_WORKSPACE).map((project: any) => ({
    id: project.id,
    name: project.name,
    prompt: project.prompt,
    direction: project.direction,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    document: normalizeOpenPageDocument(project.page, project.name),
  }));
  return NextResponse.json({ ok: true, workspace: OPENPAGE_WORKSPACE, projects, memoryVault: 'G-Brain · openpage/', ai: openPageGeminiStatus() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = body?.action;
  const db = getDb();
  if (action === 'starter') return NextResponse.json({ ok: true, document: defaultOpenPageDocument(typeof body?.name === 'string' ? body.name : undefined), source: 'starter' });

  if (action === 'scrape') {
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url) return NextResponse.json({ ok: false, error: 'Add a public website URL to scan.' }, { status: 400 });
    try {
      const analysis = await scrapeWebsite(url, typeof body?.maxPages === 'number' ? body.maxPages : 8);
      return NextResponse.json({ ok: true, analysis, templateDocument: templateDocument(analysis), memoryVault: 'G-Brain · openpage/templates/' });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 422 });
    }
  }

  if (action === 'save-template') {
    const analysis = asScrapedAnalysis(body?.analysis);
    if (!analysis) return NextResponse.json({ ok: false, error: 'A completed website scan is required before saving a template.' }, { status: 400 });
    const id = `openpage-template-${randomUUID()}`;
    const now = new Date().toISOString();
    const document = templateDocument(analysis);
    db.websiteProjects.save({ id, name: document.name, prompt: `Reusable brand template extracted from ${analysis.sourceUrl}`, direction: 'openpage-template', workspaceId: OPENPAGE_TEMPLATE_WORKSPACE, page: { ...document, sourceAnalysis: analysis }, createdAt: now, updatedAt: now });
    const memory = await getBrainProvider().capture({ title: `OpenPage Template · ${analysis.siteName}`, text: `Reusable OpenPage template from ${analysis.sourceUrl}\nBrand colors: ${analysis.brand.colors.join(', ')}\nFonts: ${analysis.brand.fonts.join(', ') || 'not detected'}\nPages scanned: ${analysis.pagesScanned}\nSuggestions:\n${analysis.suggestions.map((item) => `- ${item}`).join('\n')}`, type: 'openpage-template', slug: `openpage/templates/${analysis.siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 55)}-${id.slice(-8)}` });
    return NextResponse.json({ ok: true, id, template: document, memory, workspace: OPENPAGE_TEMPLATE_WORKSPACE, memoryVault: 'G-Brain · openpage/templates/' }, { status: 201 });
  }

  if (action === 'context') {
    const query = typeof body?.query === 'string' ? body.query : 'OpenPage website drafts';
    const results = (await getBrainProvider().search(query)).filter((item) => item.title.toLowerCase().startsWith('openpage/'));
    return NextResponse.json({ ok: true, workspace: OPENPAGE_WORKSPACE, results });
  }

  if (action === 'edit') {
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return NextResponse.json({ ok: false, error: 'Tell the OpenPage copilot what to change.' }, { status: 400 });
    if (!body?.document || typeof body.document !== 'object') return NextResponse.json({ ok: false, error: 'A current OpenPage document is required.' }, { status: 400 });
    const current = normalizeOpenPageDocument(body.document);
    const sourceAnalysis = asScrapedAnalysis(body.analysis);
    const brain = await getBrainProvider().search(`openpage ${prompt}`);
    const system = `You are the OpenPage AI copilot inside Business OS. Return ONLY valid JSON matching the OpenPage document schema. Apply the user's requested change to the current document and return the COMPLETE replacement document, never an explanation or a partial patch. Preserve schemaVersion "openpage-v1". Keep existing content, brand colors, typography, navigation, and structure unless the user asks to change them. If the user asks to redo, rethink, refresh, or try another version, create a genuinely different but coherent version while preserving the site's identity. Keep 3-12 useful blocks, accessible copy, responsive hierarchy, and clear conversion flow. Write all visible copy as complete natural sentences with normal spacing, punctuation, and paragraph breaks. Never concatenate labels, phrases, or thoughts into a clump. Never include HTML or markdown. The current document schema is:\n${JSON.stringify(current, null, 2)}`;
    const sourceContext = sourceAnalysis ? `\n\nScanned source brand to preserve:\n${JSON.stringify({ siteName: sourceAnalysis.siteName, sourceUrl: sourceAnalysis.sourceUrl, brand: sourceAnalysis.brand, layout: sourceAnalysis.layout, pages: sourceAnalysis.pages.slice(0, 8).map((page) => ({ path: page.path, title: page.title, headings: page.headings.slice(0, 6) })) })}` : '';
    const userPrompt = `Requested edit: ${prompt}\n\nRelevant G-Brain context:\n${brain.map((item) => `${item.title}: ${item.snippet}`).join('\n') || 'No matching notes yet.'}${sourceContext}`;
    try {
      let generatedText: string;
      if (openPageGeminiStatus().configured) {
        try {
          generatedText = await generateWithGemini({ system, prompt: userPrompt });
        } catch {
          generatedText = (await llmChat({ system, messages: [{ role: 'user', content: userPrompt }] })).text;
        }
      } else {
        generatedText = (await llmChat({ system, messages: [{ role: 'user', content: userPrompt }] })).text;
      }
      const parsed = parseJsonObject(generatedText);
      if (!parsed) throw new Error('The live model returned no valid OpenPage document.');
      const document = normalizeOpenPageDocument(parsed, current.name);
      return NextResponse.json({ ok: true, document, message: `Applied: ${prompt}`, provider: openPageGeminiStatus().configured ? 'Gemini' : 'OpenAI/Gateway fallback', brainContext: brain.slice(0, 5) });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 503 });
    }
  }

  if (action === 'generate') {
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return NextResponse.json({ ok: false, error: 'Add a brief before generating.' }, { status: 400 });
    const sourceAnalysis = asScrapedAnalysis(body?.analysis);
    const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : sourceAnalysis ? `${sourceAnalysis.siteName} · Cleaner redesign` : 'OpenPage AI draft';
    const brain = await getBrainProvider().search(`openpage ${prompt}`);
    const starter = sourceAnalysis ? normalizeOpenPageDocument({ ...templateDocument(sourceAnalysis), name }, name) : defaultOpenPageDocument(name);
    const schemaExample = JSON.stringify(starter, null, 2);
    const system = `You are OpenPage, a structured website design agent inside Business OS. Return ONLY valid JSON matching the OpenPage document schema. Preserve schemaVersion "openpage-v1", use 3-12 blocks, and write a complete new page—not an explanation. When source analysis is provided, use the imported seed as the baseline: preserve the source brand colors, typography direction, navigation intent, recognizable content themes, and real page titles while improving hierarchy, readability, accessibility, responsiveness, and conversion flow. Do not discard the source-specific content for generic filler. Write all visible copy as complete natural sentences with normal spacing, punctuation, and paragraph breaks. Never concatenate labels, phrases, or thoughts into a clump. Never include HTML or markdown. The JSON shape is:\n${schemaExample}`;
    const sourceContext = sourceAnalysis ? `\n\nSource website analysis (preserve the brand, improve the experience):\n${JSON.stringify({ sourceUrl: sourceAnalysis.sourceUrl, siteName: sourceAnalysis.siteName, brand: sourceAnalysis.brand, layout: sourceAnalysis.layout, pages: sourceAnalysis.pages.map((page) => ({ path: page.path, title: page.title, description: page.description.slice(0, 600), headings: page.headings.slice(0, 8), text: page.text.slice(0, 1400) })), suggestions: sourceAnalysis.suggestions })}\n\nImported seed to improve (return the full replacement document):\n${JSON.stringify(starter)}` : '';
    const userPrompt = `Brief: ${prompt}\n\nRelevant G-Brain context:\n${brain.map((item) => `${item.title}: ${item.snippet}`).join('\n') || 'No matching notes yet.'}${sourceContext}`;
    try {
      let generatedText: string;
      let source: 'gemini' | 'openai-fallback' = 'gemini';
      if (openPageGeminiStatus().configured) {
        try {
          generatedText = await generateWithGemini({ system, prompt: userPrompt });
        } catch {
          source = 'openai-fallback';
          generatedText = (await llmChat({ system, messages: [{ role: 'user', content: userPrompt }] })).text;
        }
      } else {
        source = 'openai-fallback';
        generatedText = (await llmChat({ system, messages: [{ role: 'user', content: userPrompt }] })).text;
      }
      const parsed = parseJsonObject(generatedText);
      if (!parsed) {
        if (sourceAnalysis) return NextResponse.json({ ok: true, document: starter, source: 'brand-preserving-fallback', provider: 'Imported scan fallback', warning: 'The live model returned no valid document, so OpenPage prepared a branded redesign from the scan.' });
        throw new Error('The live model returned no valid OpenPage JSON.');
      }
      return NextResponse.json({ ok: true, document: normalizeOpenPageDocument({ ...parsed, name }), source, provider: source === 'gemini' ? 'Gemini' : 'OpenAI/Gateway fallback', brainContext: brain.slice(0, 5) });
    } catch (error) {
      if (sourceAnalysis) return NextResponse.json({ ok: true, document: starter, source: 'brand-preserving-fallback', provider: 'Imported scan fallback', warning: `Live AI was unavailable (${error instanceof Error ? error.message : String(error)}), so OpenPage prepared a branded redesign from the scan.` });
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error), starter, source: 'starter-available' }, { status: 503 });
    }
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  const normalized = normalizeOpenPageDocument({ ...parsed.data.document, name: parsed.data.name }, parsed.data.name);
  const now = new Date().toISOString();
  const existing = parsed.data.id ? db.websiteProjects.all(OPENPAGE_WORKSPACE).find((project: any) => project.id === parsed.data.id) : undefined;
  const id = parsed.data.id ?? randomUUID();
  const sourceAnalysis = asScrapedAnalysis(parsed.data.sourceAnalysis);
  db.websiteProjects.save({ id, name: parsed.data.name, prompt: parsed.data.prompt, direction: sourceAnalysis ? 'openpage-redesign' : 'openpage-json', workspaceId: OPENPAGE_WORKSPACE, page: sourceAnalysis ? { ...normalized, sourceAnalysis } : normalized, createdAt: existing?.created_at ?? now, updatedAt: now });
  const memory = await getBrainProvider().capture({ title: `OpenPage · ${parsed.data.name}`, text: `${openPageMemoryText(normalized, parsed.data.prompt)}${sourceAnalysis ? `\nSource website: ${sourceAnalysis.sourceUrl}\nPreserved colors: ${sourceAnalysis.brand.colors.join(', ')}\nRedesign suggestions: ${sourceAnalysis.suggestions.join(' | ')}` : ''}`, type: 'openpage', slug: openPageSlug(parsed.data.name, id) });
  return NextResponse.json({ ok: true, project: { id, name: parsed.data.name, prompt: parsed.data.prompt, document: normalized }, memory: { ...memory, vault: 'G-Brain · openpage/' } }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null) as { action?: string; document?: OpenPageDocument } | null;
  if (body?.action !== 'export' || !body.document) return NextResponse.json({ ok: false, error: 'Use action=export with a document.' }, { status: 400 });
  const document = normalizeOpenPageDocument(body.document);
  return new NextResponse(renderOpenPageHtml(document), { headers: { 'content-type': 'text/html; charset=utf-8', 'content-disposition': `attachment; filename="${document.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'openpage'}.html"` } });
}
