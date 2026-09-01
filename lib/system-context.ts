import { getDb } from '@/lib/data';
import { getBrainProvider } from '@/lib/brain';

/** Shared context passed to AI-facing modules. Keeps Website Builder, Affiliate
 * Studio, agents, and the Brain aligned without duplicating business data. */
export async function systemContext(query?: string) {
  const db = getDb();
  const brain = query ? await getBrainProvider().search(query) : [];
  return {
    agents: db.agents.all().map((a) => ({ id: a.id, name: a.name, tools: a.tools })),
    products: db.affiliateProducts.all().slice(0, 50),
    campaigns: db.affiliateCampaigns.all(),
    websiteProjects: db.websiteProjects.all(),
    brain,
  };
}
