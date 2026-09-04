import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { LlmToolSpec } from '@/lib/connectors/llm';
import { getDb } from '@/lib/data';
import { getBrainProvider } from '@/lib/brain';
import { OPENPAGE_WORKSPACE, defaultOpenPageDocument, normalizeOpenPageDocument, openPageMemoryText, openPageSlug } from '@/lib/openpage';

/** Agent tools for the separate OpenPage JSON workspace. Mutating tools only
 * save local drafts and capture memory; WordPress publishing remains separate
 * and approval-gated through the CMS tools. */
export function openPageTools(): LlmToolSpec[] {
  return [
    {
      name: 'inspectOpenPageWorkspace',
      description: 'Inspect real OpenPage projects saved in the separate openpage workspace and report their current blocks and memory namespace.',
      parameters: z.object({}),
      execute: async () => ({
        workspace: OPENPAGE_WORKSPACE,
        memoryVault: 'G-Brain · openpage/',
        projects: getDb().websiteProjects.all(OPENPAGE_WORKSPACE).map((project: any) => ({ id: project.id, name: project.name, updatedAt: project.updated_at, blocks: normalizeOpenPageDocument(project.page, project.name).blocks.map((item) => `${item.type}:${item.label}`) })),
      }),
    },
    {
      name: 'searchOpenPageMemory',
      description: 'Search the OpenPage-specific G-Brain memory namespace for briefs, decisions, and prior page drafts.',
      parameters: z.object({ query: z.string().min(1) }),
      execute: async ({ query }) => ({ workspace: OPENPAGE_WORKSPACE, results: (await getBrainProvider().search(String(query))).filter((item) => item.title.toLowerCase().startsWith('openpage/')) }),
    },
    {
      name: 'createOpenPageDraft',
      description: 'Create a real local OpenPage draft in the separate workspace and capture its brief in the OpenPage G-Brain memory namespace. Does not publish to WordPress.',
      parameters: z.object({ name: z.string().min(1), brief: z.string().min(1), document: z.record(z.unknown()).optional() }),
      execute: async ({ name, brief, document }) => {
        const db = getDb();
        const id = randomUUID();
        const now = new Date().toISOString();
        const normalized = normalizeOpenPageDocument(document ?? defaultOpenPageDocument(String(name)), String(name));
        db.websiteProjects.save({ id, name: String(name), prompt: String(brief), direction: 'openpage-json', workspaceId: OPENPAGE_WORKSPACE, page: normalized, createdAt: now, updatedAt: now });
        const memory = await getBrainProvider().capture({ title: `OpenPage · ${String(name)}`, text: openPageMemoryText(normalized, String(brief)), type: 'openpage', slug: openPageSlug(String(name), id) });
        return { ok: true, id, workspace: OPENPAGE_WORKSPACE, blocks: normalized.blocks.length, memory };
      },
    },
    {
      name: 'updateOpenPageDraft',
      description: 'Update an existing OpenPage local draft with a structured document and recapture its memory. Does not publish external content.',
      parameters: z.object({ projectId: z.string().min(1), brief: z.string().optional(), document: z.record(z.unknown()) }),
      execute: async ({ projectId, brief, document }) => {
        const db = getDb();
        const existing = db.websiteProjects.all(OPENPAGE_WORKSPACE).find((project: any) => project.id === projectId);
        if (!existing) return { ok: false, error: 'OpenPage project not found in the openpage workspace.' };
        const normalized = normalizeOpenPageDocument(document, existing.name);
        const now = new Date().toISOString();
        db.websiteProjects.save({ id: existing.id, name: existing.name, prompt: typeof brief === 'string' ? brief : existing.prompt, direction: 'openpage-json', workspaceId: OPENPAGE_WORKSPACE, page: normalized, createdAt: existing.created_at, updatedAt: now });
        const memory = await getBrainProvider().capture({ title: `OpenPage · ${existing.name}`, text: openPageMemoryText(normalized, typeof brief === 'string' ? brief : existing.prompt), type: 'openpage', slug: openPageSlug(existing.name, existing.id) });
        return { ok: true, id: existing.id, workspace: OPENPAGE_WORKSPACE, blocks: normalized.blocks.length, memory };
      },
    },
  ];
}
