import { randomUUID } from 'node:crypto';
import type { MissionStep, SuperAgentMission, SuperAgentRiskLevel, SuperAgentRole } from './contracts';

export type MissionStepInput = {
  title: string;
  ownerRole: SuperAgentRole;
  requiredCapabilities: string[];
  dependsOn?: string[];
  risk?: SuperAgentRiskLevel;
  evidenceRequired?: string[];
};

export type MissionPlanInput = {
  businessId: string;
  objective: string;
  ownerRole: SuperAgentRole;
  steps: MissionStepInput[];
};

function validateDependencies(steps: MissionStep[]): void {
  const ids = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    for (const dependency of step.dependsOn) {
      if (!ids.has(dependency)) throw new Error(`unknown mission dependency: ${dependency}`);
      if (dependency === step.id) throw new Error(`mission step cannot depend on itself: ${step.id}`);
    }
  }
}

function hasCycle(steps: MissionStep[]): boolean {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (visit(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return steps.some((step) => visit(step.id));
}

export function createMissionPlan(input: MissionPlanInput, now = new Date()): SuperAgentMission {
  if (!input.objective.trim()) throw new Error('mission objective is required');
  if (!input.steps.length) throw new Error('mission requires at least one step');

  const stepIds = input.steps.map((_, index) => `step-${index + 1}`);
  const steps: MissionStep[] = input.steps.map((step, index) => ({
    id: stepIds[index],
    title: step.title,
    ownerRole: step.ownerRole,
    requiredCapabilities: [...new Set(step.requiredCapabilities)],
    dependsOn: (step.dependsOn ?? []).map((dependency) => {
      if (/^step-\d+$/.test(dependency)) return dependency;
      const numeric = Number(dependency);
      return Number.isInteger(numeric) && numeric >= 1 ? `step-${numeric}` : dependency;
    }),
    risk: step.risk ?? 'green',
    evidenceRequired: step.evidenceRequired?.length ? step.evidenceRequired : ['observable result'],
  }));

  validateDependencies(steps);
  if (hasCycle(steps)) throw new Error('mission dependency graph contains a cycle');

  const timestamp = now.toISOString();
  const requiresApproval = steps.some((step) => step.risk !== 'green');

  return {
    id: randomUUID(),
    businessId: input.businessId,
    objective: input.objective,
    ownerRole: input.ownerRole,
    status: requiresApproval ? 'awaiting-approval' : 'ready',
    steps,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function readySteps(mission: SuperAgentMission, completedStepIds: string[]): MissionStep[] {
  const complete = new Set(completedStepIds);
  return mission.steps.filter((step) => !complete.has(step.id) && step.dependsOn.every((dependency) => complete.has(dependency)));
}
