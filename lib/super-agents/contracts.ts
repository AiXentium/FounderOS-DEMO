export type SuperAgentRiskLevel = 'green' | 'yellow' | 'red';

export type SuperAgentRole =
  | 'tbrain'
  | 'chief-of-staff'
  | 'ceo'
  | 'cfo'
  | 'cmo'
  | 'cro'
  | 'coo'
  | 'cto'
  | 'customer-success'
  | 'website'
  | 'creative-director'
  | 'ugc-studio';

export type CapabilityRef = {
  id: string;
  kind: 'agent' | 'skill' | 'tool' | 'workflow' | 'service' | 'model' | 'knowledge';
  required?: boolean;
  notes?: string;
};

export type KpiDefinition = {
  id: string;
  label: string;
  direction: 'increase' | 'decrease' | 'maintain';
  unit?: string;
  target?: number;
  warningThreshold?: number;
};

export type ApprovalRule = {
  action: string;
  risk: SuperAgentRiskLevel;
  requiresHumanApproval: boolean;
  rationale: string;
};

export type MemoryPolicy = {
  readScopes: Array<'global' | 'business' | 'department' | 'project' | 'agent' | 'task'>;
  writeScopes: Array<'business' | 'department' | 'project' | 'agent' | 'task'>;
  remember: string[];
  neverRemember: string[];
};

export type TeamPolicy = {
  mayComposeTeams: boolean;
  maxConcurrentWorkers: number;
  preferredCapabilities: string[];
  requireNamedSupervisorForParallelWork: boolean;
};

export type ExecutionPolicy = {
  allowedPatterns: Array<'direct' | 'sequential' | 'parallel' | 'supervisor' | 'handoff' | 'plan-execute-judge'>;
  maxPlanSteps: number;
  maxRetriesPerStep: number;
  requireEvidenceForCompletion: boolean;
  requireJudgeForHighImpactWork: boolean;
};

export type EvaluationPolicy = {
  successCriteria: string[];
  evidenceRequirements: string[];
  failureSignals: string[];
  repairStrategy: 'retry' | 'replan' | 'handoff' | 'human-review';
};

export type SuperAgentDefinition = {
  id: string;
  name: string;
  role: SuperAgentRole;
  department: string;
  mission: string;
  responsibilities: string[];
  authority: string[];
  prohibitedActions: string[];
  capabilityNeeds: CapabilityRef[];
  kpis: KpiDefinition[];
  approvalRules: ApprovalRule[];
  memoryPolicy: MemoryPolicy;
  teamPolicy: TeamPolicy;
  executionPolicy: ExecutionPolicy;
  evaluationPolicy: EvaluationPolicy;
  modelPolicy: {
    mode: 'router';
    prefer: string[];
    avoid: string[];
    notes: string;
  };
};

export type BusinessContext = {
  businessId: string;
  projectId?: string;
  objective: string;
  constraints: string[];
  availableCapabilities: string[];
  kpiSnapshot?: Record<string, number>;
};

export type MissionStep = {
  id: string;
  title: string;
  ownerRole: SuperAgentRole;
  requiredCapabilities: string[];
  dependsOn: string[];
  risk: SuperAgentRiskLevel;
  evidenceRequired: string[];
};

export type SuperAgentMission = {
  id: string;
  businessId: string;
  objective: string;
  ownerRole: SuperAgentRole;
  status: 'draft' | 'awaiting-approval' | 'ready' | 'running' | 'blocked' | 'judging' | 'complete' | 'failed';
  steps: MissionStep[];
  createdAt: string;
  updatedAt: string;
};

export type CapabilityResolution = {
  requested: string[];
  resolved: CapabilityRef[];
  missing: string[];
};
