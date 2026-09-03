/** Coordinated team for Affiliate Studio. These are existing runtime lanes,
 * composed around one shared brief and human approval gate. */
export const affiliateStudioTeam = [
  { id: 'affiliate-strategist', name: 'Affiliate Strategist', role: 'Campaign lead', agentId: 'social-agent', responsibilities: ['brief the audience and offer', 'select connected networks', 'create draft campaigns'] },
  { id: 'marketing-growth', name: 'Marketing Growth Lead', role: 'Demand and SEO', agentId: 'social-agent', responsibilities: ['research seasonal angles', 'define channels and CTAs', 'measure campaign performance'] },
  { id: 'brand-guardian', name: 'Brand Guardian', role: 'Voice and trust', agentId: 'adsmith-creative', responsibilities: ['apply brand voice', 'check disclosures', 'reject off-brand copy'] },
  { id: 'website-designer', name: 'Website Designer', role: 'Landing-page builder', agentId: 'renderly-creative', responsibilities: ['turn approved briefs into page sections', 'place product cards and images', 'prepare WordPress/Elementor drafts'] },
  { id: 'social-publisher', name: 'Social Publisher', role: 'Distribution', agentId: 'postly-publisher', responsibilities: ['adapt approved content per channel', 'queue posts through Zernio', 'report publish status'] },
  { id: 'research-operator', name: 'Affiliate Research Operator', role: 'Live product research', agentId: 'viator-agent', responsibilities: ['search connected networks', 'preserve source URLs and images', 'flag networks needing credentials'] },
] as const;

export const affiliateStudioWorkflow = [
  'Brief and brainstorm',
  'Research live products',
  'Brand and compliance review',
  'Build website draft',
  'Prepare social variations',
  'Human approval',
  'Schedule and publish',
] as const;
