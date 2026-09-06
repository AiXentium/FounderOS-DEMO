import { getDb } from '@/lib/data';
import { getBrainProvider } from '@/lib/brain';

/** Shared operating contract for the OS and the first business it operates. */
export const OPERATING_MISSION = {
  commandCenter: 'Business OS coordinates strategy, brand, website, content, social, affiliate, memory, and measurement in one workspace.',
  firstBusiness: "Let's Talk Miles & Travel",
  businessPurpose: 'Help travelers make better points, miles, credit-card, itinerary, and booking decisions through useful, trustworthy guidance.',
  growthLoop: 'Research and evidence -> branded website resource -> helpful content -> owned audience -> transparent affiliate recommendation -> measurement and improvement.',
  operatingRules: [
    'Use G-Brain memory and the Conductor to ground decisions in approved context.',
    'Preserve the travel brand, use real rights-cleared assets, and never invent business facts.',
    'Prepare complete websites and channel plans, not isolated pages or repetitive content.',
    'Keep claims, affiliate disclosures, rights, and platform checks reviewable.',
    'Require explicit human approval before publishing or changing external systems.',
  ],
} as const;

/** Shared context passed to AI-facing modules. Keeps Website Builder, Affiliate
 * Studio, agents, and the Brain aligned without duplicating business data. */
export async function systemContext(query?: string) {
  const db = getDb();
  const brain = query ? await getBrainProvider().search(query) : [];
  return {
    mission: OPERATING_MISSION,
    agents: db.agents.all().map((a) => ({ id: a.id, name: a.name, tools: a.tools })),
    products: db.affiliateProducts.all().slice(0, 50),
    campaigns: db.affiliateCampaigns.all(),
    websiteProjects: db.websiteProjects.all(),
    brain,
  };
}
