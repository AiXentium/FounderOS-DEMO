import { describe, expect, it, vi } from 'vitest';
import { openDb } from '@/lib/db';
import { saveRevision } from '@/lib/website-revisions';
const mocks = vi.hoisted(() => ({ chat: vi.fn(), search: vi.fn(), status: vi.fn() }));
vi.mock('@/lib/connectors/llm', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/connectors/llm')>(), chat: mocks.chat, getLlmProvider: () => ({ name: 'test-real-provider' }) }));
vi.mock('@/lib/brain', () => ({ getBrainProvider: () => ({ search: mocks.search, status: mocks.status }) }));
vi.mock('@/lib/agents/real', () => ({ realAgents: ['agency-marketing-content-creator', 'agency-design-ui-designer', 'agency-marketing-seo-specialist', 'agency-design-visual-storyteller', 'viator-agent', 'agency-testing-reality-checker', 'agency-engineering-frontend-developer'].map(id => ({ id, name: id, description: 'Specialist', departmentId: 'website', run: vi.fn() })) }));
import { runWebsitePage } from '@/lib/website-page-worker';

function setup() {
  const db = openDb(':memory:');
  const state = saveRevision({ projectId: 'pilot', pagePath: 'index.html', version: 0, sourceHashes: {}, revisions: [], runs: [], releases: [] }, '<html><head></head><body>Original real content</body></html>', 'source');
  db.websiteLifecycle.put(state, 0);
  db.localJobs.enqueue({ id: 'job', type: 'website-page-revision', createdAt: new Date().toISOString(), payload: { projectId: 'pilot', pagePath: 'index.html', revisionId: state.selectedId, request: 'Improve readability' } });
  return db;
}
describe('website worker integration', () => {
  it('retrieves G-Brain, runs specialists, persists replies and an unapproved HTML revision once', async () => {
    const db = setup();
    mocks.status.mockResolvedValue({ connected: true, provider: 'gbrain', detail: 'ok' });
    mocks.search.mockResolvedValue([{ title: 'Brand', snippet: 'Preserve source', source: 'project' }]);
    mocks.chat.mockReset();
    for (const lane of ['content', 'design', 'seo', 'media', 'affiliate']) mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ summary: lane, changes: [`${lane} proposal`], warnings: [], status: 'proposed' }), toolCalls: [] });
    mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ edits: [{ before: 'Original real content', after: 'Revised real content' }] }), toolCalls: [] });
    mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ summary: 'QA checked', changes: ['Source preserved'], warnings: [], status: 'passed' }), toolCalls: [] });
    await runWebsitePage(db, 'job');
    await runWebsitePage(db, 'job');
    const state = db.websiteLifecycle.get()!;
    expect(state.runs[0].error).toBeUndefined();
    expect(mocks.chat).toHaveBeenCalledTimes(7);
    expect(mocks.chat.mock.calls[5][0].messages[0].content).toContain('content proposal');
    expect(state.runs[0].results).toHaveLength(7);
    expect(state.runs[0].status).toBe('completed');
    expect(state.revisions).toHaveLength(2);
    expect(state.revisions[0].html).toContain('Original');
    expect(state.revisions[1].approvedHash).toBeUndefined();
    expect(state.revisions[1].contentChanges).toEqual(['content proposal']);
    expect(state.revisions[1].designChanges).toEqual(['design proposal']);
    expect(state.revisions[1].mediaChanges).toEqual(['media proposal']);
    expect(state.revisions[1].seo).toEqual(['seo proposal']);
    expect(state.revisions[1].affiliateProposals).toEqual(['affiliate proposal']);
    expect(state.revisions[1].qa.status).toBe('passed');
    expect(state.revisions[1].status).toBe('draft');
    expect(state.revisions[1].appliedEdits).toHaveLength(1);
    db.close();
  });
  it('retains an honest failure without approving or replacing the source', async () => {
    const db = setup();
    mocks.status.mockResolvedValue({ connected: false, detail: 'unavailable' });
    mocks.search.mockResolvedValue([]);
    await runWebsitePage(db, 'job');
    const state = db.websiteLifecycle.get()!;
    expect(state.revisions).toHaveLength(1);
    expect(state.runs[0].status).toBe('failed');
    expect(db.localJobs.all()[0].status).toBe('failed');
    db.close();
  });
  it('corrects an ambiguous edit once and retains both composer results', async () => {
    const db = setup();
    mocks.status.mockResolvedValue({ connected: true, detail: 'ok' });
    mocks.search.mockResolvedValue([]);
    mocks.chat.mockReset();
    for (let i = 0; i < 5; i++) mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ summary: 'Review', changes: [], warnings: [], status: 'proposed' }), toolCalls: [] });
    mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ edits: [{ before: 'Missing substring', after: 'Incorrect' }] }), toolCalls: [] });
    mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ edits: [{ before: 'Original real content', after: 'Revised real content' }] }), toolCalls: [] });
    mocks.chat.mockResolvedValueOnce({ text: JSON.stringify({ summary: 'Visual verification required', changes: ['Source preserved'], warnings: ['Review images'], status: 'needs_input' }), toolCalls: [] });
    await runWebsitePage(db, 'job');
    const state = db.websiteLifecycle.get()!;
    expect(state.runs[0].status).toBe('completed');
    expect(state.runs[0].results).toHaveLength(8);
    expect(state.revisions[1].qa.status).toBe('needs_review');
    expect(state.revisions[1].status).toBe('needs_review');
    expect(state.revisions[0].html).toContain('Original real content');
    db.close();
  });
});
