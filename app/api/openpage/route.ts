import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { getBrainProvider } from '@/lib/brain';
import { chat as llmChat } from '@/lib/connectors/llm';
import { OPENPAGE_WORKSPACE, defaultOpenPageDocument, normalizeOpenPageDocument, openPageMemoryText, openPageSlug, renderOpenPageHtml, type OpenPageDocument } from '@/lib/openpage';

export const dynamic = 'force-dynamic';

const DocumentSchema = z.record(z.unknown());
const SaveSchema = z.object({
  action: z.literal('save'),
  id: z.string().optional(),
  name: z.string().min(1),
  prompt: z.string().default(''),
  document: DocumentSchema,
});

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'projects';
  const db = getDb();
  if (action === 'context') {
    const query = url.searchParams.get('query')?.trim() || 'OpenPage website drafts';
    const results = (await getBrainProvider().search(query)).filter((item) => item.title.toLowerCase().startsWith('openpage/'));
    return NextResponse.json({ ok: true, workspace: OPENPAGE_WORKSPACE, results });
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
  return NextResponse.json({ ok: true, workspace: OPENPAGE_WORKSPACE, projects, memoryVault: 'G-Brain · openpage/' });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = body?.action;
  const db = getDb();
  if (action === 'starter') return NextResponse.json({ ok: true, document: defaultOpenPageDocument(typeof body?.name === 'string' ? body.name : undefined), source: 'starter' });

  if (action === 'context') {
    const query = typeof body?.query === 'string' ? body.query : 'OpenPage website drafts';
    const results = (await getBrainProvider().search(query)).filter((item) => item.title.toLowerCase().startsWith('openpage/'));
    return NextResponse.json({ ok: true, workspace: OPENPAGE_WORKSPACE, results });
  }

  if (action === 'generate') {
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return NextResponse.json({ ok: false, error: 'Add a brief before generating.' }, { status: 400 });
    const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'OpenPage AI draft';
    const brain = await getBrainProvider().search(`openpage ${prompt}`);
    const starter = defaultOpenPageDocument(name);
    const schemaExample = JSON.stringify(starter, null, 2);
    try {
      const result = await llmChat({
        system: `You are OpenPage, a structured website design agent inside Business OS. Return ONLY valid JSON matching the OpenPage document schema. Preserve schemaVersion "openpage-v1", use 3-12 blocks, and write specific copy from the brief. Never include HTML or markdown. The JSON shape is:\n${schemaExample}`,
        messages: [{ role: 'user', content: `Brief: ${prompt}\n\nRelevant G-Brain context:\n${brain.map((item) => `${item.title}: ${item.snippet}`).join('\n') || 'No matching notes yet.'}` }],
      });
      const parsed = parseJsonObject(result.text);
      if (!parsed) throw new Error('The live model returned no valid OpenPage JSON.');
      return NextResponse.json({ ok: true, document: normalizeOpenPageDocument({ ...parsed, name }), source: 'live-llm', brainContext: brain.slice(0, 5) });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error), starter, source: 'starter-available' }, { status: 503 });
    }
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  const normalized = normalizeOpenPageDocument({ ...parsed.data.document, name: parsed.data.name }, parsed.data.name);
  const now = new Date().toISOString();
  const existing = parsed.data.id ? db.websiteProjects.all(OPENPAGE_WORKSPACE).find((project: any) => project.id === parsed.data.id) : undefined;
  const id = parsed.data.id ?? randomUUID();
  db.websiteProjects.save({ id, name: parsed.data.name, prompt: parsed.data.prompt, direction: 'openpage-json', workspaceId: OPENPAGE_WORKSPACE, page: normalized, createdAt: existing?.created_at ?? now, updatedAt: now });
  const memory = await getBrainProvider().capture({ title: `OpenPage · ${parsed.data.name}`, text: openPageMemoryText(normalized, parsed.data.prompt), type: 'openpage', slug: openPageSlug(parsed.data.name, id) });
  return NextResponse.json({ ok: true, project: { id, name: parsed.data.name, prompt: parsed.data.prompt, document: normalized }, memory: { ...memory, vault: 'G-Brain · openpage/' } }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null) as { action?: string; document?: OpenPageDocument } | null;
  if (body?.action !== 'export' || !body.document) return NextResponse.json({ ok: false, error: 'Use action=export with a document.' }, { status: 400 });
  const document = normalizeOpenPageDocument(body.document);
  return new NextResponse(renderOpenPageHtml(document), { headers: { 'content-type': 'text/html; charset=utf-8', 'content-disposition': `attachment; filename="${document.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'openpage'}.html"` } });
}
