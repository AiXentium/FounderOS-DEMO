import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { systemContext } from '@/lib/system-context';
import { allConnectorStatuses } from '@/lib/connectors';
import { readUserSkills } from '@/lib/skills-catalog';

export const dynamic = 'force-dynamic';

/** Shared Website Builder team context. All lists are read from the live registries. */
export async function GET(request: Request) {
  const db = getDb();
  const context = await systemContext(new URL(request.url).searchParams.get('query') || undefined);
  const [connectors, skills] = await Promise.all([allConnectorStatuses(), Promise.resolve(readUserSkills())]);
  return NextResponse.json({
    agents: context.agents,
    skills: [...db.skills.all(), ...skills],
    tools: db.tools.all(),
    connectors,
    projects: context.websiteProjects,
    brain: context.brain,
  });
}
