import { describe, expect, it, vi } from 'vitest';
import { openDb } from '@/lib/db';
import { saveRevision } from '@/lib/website-revisions';
const mocks = vi.hoisted(() => ({ chat: vi.fn(), search: vi.fn(), status: vi.fn() }));
vi.mock('@/lib/connectors/llm', () => ({ chat: mocks.chat, getLlmProvider: () => ({ name: 'test-real-provider' }) }));
vi.mock('@/lib/brain', () => ({ getBrainProvider: () => ({ search: mocks.search, status: mocks.status }) }));
vi.mock('@/lib/agents/real', () => ({ realAgents: ['agency-marketing-content-creator', 'agency-marketing-seo-specialist', 'agency-engineering-frontend-developer'].map(id => ({ id, name: id, description: 'Specialist', departmentId: 'website', run: vi.fn() })) }));
vi.mock('@/lib/agents/chat', () => ({ systemPromptFor: (agent: { id: string }) => agent.id }));
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
    mocks.chat.mockReset().mockResolvedValueOnce({ text: 'Clarify the heading', toolCalls: [] }).mockResolvedValueOnce({ text: 'Keep the title', toolCalls: [] }).mockResolvedValueOnce({ text: JSON.stringify({ edits: [{ before: 'Original real content', after: 'Revised real content' }] }), toolCalls: [] });
    await runWebsitePage(db, 'job');
    await runWebsitePage(db, 'job');
    const state = db.websiteLifecycle.get()!;
    expect(mocks.chat).toHaveBeenCalledTimes(3);
    expect(mocks.chat.mock.calls[2][0].messages[0].content).toContain('Clarify the heading');
    expect(state.runs[0].results).toHaveLength(3);
    expect(state.runs[0].status).toBe('completed');
    expect(state.revisions).toHaveLength(2);
    expect(state.revisions[0].html).toContain('Original');
    expect(state.revisions[1].approvedHash).toBeUndefined();
    db.close();
  });
  it('retains an honest failure without approving or replacing the source', async () => {
    const db = setup();
    mocks.status.mockResolvedValue({ connected: false, detail: 'unavailable' });
    await runWebsitePage(db, 'job');
    const state = db.websiteLifecycle.get()!;
    expect(state.revisions).toHaveLength(1);
    expect(state.runs[0].status).toBe('failed');
    expect(db.localJobs.all()[0].status).toBe('failed');
    db.close();
  });
});
