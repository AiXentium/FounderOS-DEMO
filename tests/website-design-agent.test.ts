import { describe, expect, it } from 'vitest';
import { systemPromptFor } from '@/lib/agents/chat';
import type { RuntimeAgent } from '@/lib/agents/runtime';

const agent = (id: string): RuntimeAgent => ({
  id,
  name: 'Test agent',
  description: 'Test description',
  departmentId: 'test',
  async run() { return { ok: true, summary: 'ok' }; },
});

describe('Website Design Agent contract', () => {
  it('is included for the website design runtime lanes', () => {
    const prompt = systemPromptFor(agent('renderly-creative'));
    expect(prompt).toContain('Never begin from a blank page');
    expect(prompt).toContain('full-site blueprint');
    expect(prompt).toContain('Publish only after explicit approval');
  });

  it('does not change unrelated agent prompts', () => {
    expect(systemPromptFor(agent('data-agent'))).not.toContain('Never begin from a blank page');
  });
});
