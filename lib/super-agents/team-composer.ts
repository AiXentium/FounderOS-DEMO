import type { SuperAgentDefinition, SuperAgentRole } from './contracts';
import { SUPER_AGENT_DEFINITIONS } from './definitions';
import type { CapabilityRegistry, RegisteredCapability } from './capability-registry';

export type TeamRequest = {
  objective: string;
  requiredCapabilities: string[];
  preferredLeadRole?: SuperAgentRole;
  maxMembers?: number;
};

export type TeamMember = {
  role: SuperAgentRole;
  agentId: string;
  name: string;
  matchedCapabilities: string[];
  reason: string;
};

export type ComposedTeam = {
  objective: string;
  lead: TeamMember;
  members: TeamMember[];
  resolvedCapabilities: RegisteredCapability[];
  missingCapabilities: string[];
  ready: boolean;
};

function roleCoverage(role: SuperAgentRole, capabilities: RegisteredCapability[]): string[] {
  return capabilities.filter((capability) => capability.defaultOwners.includes(role)).map((capability) => capability.id);
}

function definition(role: SuperAgentRole): SuperAgentDefinition {
  const agent = SUPER_AGENT_DEFINITIONS.find((candidate) => candidate.role === role);
  if (!agent) throw new Error(`unknown Super Agent role: ${role}`);
  return agent;
}

function memberFor(role: SuperAgentRole, matchedCapabilities: string[]): TeamMember {
  const agent = definition(role);
  return {
    role,
    agentId: agent.id,
    name: agent.name,
    matchedCapabilities,
    reason: matchedCapabilities.length
      ? `Owns ${matchedCapabilities.join(', ')}`
      : 'Selected as mission supervisor.',
  };
}

export function composeTeam(registry: CapabilityRegistry, request: TeamRequest): ComposedTeam {
  const { resolved, missing } = registry.resolve(request.requiredCapabilities);
  const maxMembers = Math.max(1, request.maxMembers ?? 6);

  const coverage = new Map<SuperAgentRole, string[]>();
  for (const agent of SUPER_AGENT_DEFINITIONS) {
    const matches = roleCoverage(agent.role, resolved);
    if (matches.length) coverage.set(agent.role, matches);
  }

  let leadRole = request.preferredLeadRole;
  if (!leadRole) {
    leadRole = [...coverage.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0] ?? 'tbrain';
  }

  const selected = new Set<SuperAgentRole>([leadRole]);
  const uncovered = new Set(resolved.map((capability) => capability.id));
  for (const id of coverage.get(leadRole) ?? []) uncovered.delete(id);

  while (uncovered.size && selected.size < maxMembers) {
    let bestRole: SuperAgentRole | undefined;
    let bestMatches: string[] = [];
    for (const [role, matches] of coverage) {
      if (selected.has(role)) continue;
      const useful = matches.filter((id) => uncovered.has(id));
      if (useful.length > bestMatches.length) {
        bestRole = role;
        bestMatches = useful;
      }
    }
    if (!bestRole || !bestMatches.length) break;
    selected.add(bestRole);
    for (const id of bestMatches) uncovered.delete(id);
  }

  const members = [...selected].map((role) => memberFor(role, coverage.get(role) ?? []));
  const lead = members.find((member) => member.role === leadRole) ?? memberFor(leadRole, []);

  return {
    objective: request.objective,
    lead,
    members,
    resolvedCapabilities: resolved,
    missingCapabilities: [...new Set([...missing, ...uncovered])],
    ready: missing.length === 0 && uncovered.size === 0,
  };
}
