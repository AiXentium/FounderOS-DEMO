import type { Agent } from '@/lib/schemas';

/**
 * The content-creation crew: the Marketing/Growth pillar, where the content
 * agent (`social-agent`) and its Postly publisher + creative workers live. The
 * lead comes first, then the workers alphabetically.
 */
export const CONTENT_DEPT_ID = 'dept-marketing-growth';

const VALUE_FIRST_AGENT_DESCRIPTIONS: Record<string, string> = {
  'social-agent': 'Coordinates value-first content: research-backed video, owned-audience bridges, SEO resources, and approved distribution.',
  'adsmith-creative': 'Original creative direction and real-asset production for approved campaigns.',
  'reelkit-editor': 'Humanized faceless editing: original commentary, licensed visuals, captions, and platform-ready cuts.',
  'renderly-creative': 'Real-image direction, thumbnails, and accessible visual assets from approved research.',
};

export function contentAgents(agents: Agent[]): Agent[] {
  // The content page has one operating lead. Agency-catalogue specialists can
  // also be marked as leads, but must not displace Social Agent as the
  // coordinator for this department.
  const isLead = (a: Agent) => (a.id === 'social-agent' ? 0 : a.tier === 'lead' || a.parentId === null ? 1 : 2);
  return agents
    .filter((a) => a.departmentId === CONTENT_DEPT_ID)
    .sort((a, b) => isLead(a) - isLead(b) || a.name.localeCompare(b.name))
    .map((agent) => VALUE_FIRST_AGENT_DESCRIPTIONS[agent.id] ? { ...agent, description: VALUE_FIRST_AGENT_DESCRIPTIONS[agent.id] } : agent);
}
