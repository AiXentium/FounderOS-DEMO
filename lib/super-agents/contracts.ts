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
  readScopes: ReadonlyArray<'global' | 'business' | 'department' | 'project' | 'agent' | 'task'>;
  writeScopes: ReadonlyArray<'business' | 'department' | 'project' | 'agent' | 'task'>;
  remember: ReadonlyArray<string>;
  neverRemember: ReadonlyArray<string>;
};

export type TeamPolicy = {
  mayComposeTeams: boolean;
  maxConcurrentWorkers: number;
  preferredCapabilities: ReadonlyArray<string>;
  requireNamedSupervisorForParallelWork: boolean;
};

export type ExecutionPolicy = {
  allowedPatterns: ReadonlyArray<'direct' | 'sequential' | 'parallel' | 'supervisor' | 'handoff' | 'plan-execute-judge'>;
  maxPlanSteps: number;
  maxRetriesPerStep: number;
  requireEvidenceForCompletion: boolean;
  requireJudgeForHighImpactWork: boolean;
};

export type EvaluationPolicy = {
  successCriteria: ReadonlyArray<string>;
  evidenceRequirements: ReadonlyArray<string>;
  failureSignals: ReadonlyArray<string>;
  repairStrategy: 'retry' | 'replan' | 'handoff' | 'human-review';
};

export type SuperAgentDefinition = {
  id: string;
  name: string;
  role: SuperAgentRole;
  department: string;
  mission: string;
  responsibilities: ReadonlyArray<string>;
  authority: ReadonlyArray<string>;
  prohibitedActions: ReadonlyArray<string>;
  capabilityNeeds: ReadonlyArray<CapabilityRef>;
  kpis: ReadonlyArray<KpiDefinition>;
  approvalRules: ReadonlyArray<ApprovalRule>;
  memoryPolicy: MemoryPolicy;
  teamPolicy: TeamPolicy;
  executionPolicy: ExecutionPolicy;
  evaluationPolicy: EvaluationPolicy;
  modelPolicy: {
    mode: 'router';
    prefer: ReadonlyArray<string>;
    avoid: ReadonlyArray<string>;
    notes: string;
  };
};

export type BusinessContext = {
  businessId: string;
  projectId?: string;
  objective: string;
  constraints: ReadonlyArray<string>;
  availableCapabilities: ReadonlyArray<string>;
  kpiSnapshot?: Readonly<Record<string, number>>;
};

export type MissionStep = {
  id: string;
  title: string;
  ownerRole: SuperAgentRole;
  requiredCapabilities: ReadonlyArray<string>;
  dependsOn: ReadonlyArray<string>;
  risk: SuperAgentRiskLevel;
  evidenceRequired: ReadonlyArray<string>;
};

export type SuperAgentMission = {
  id: string;
  businessId: string;
  objective: string;
  ownerRole: SuperAgentRole;
  status: 'draft' | 'awaiting-approval' | 'ready' | 'running' | 'blocked' | 'judging' | 'complete' | 'failed';
  steps: ReadonlyArray<MissionStep>;
  createdAt: string;
  updatedAt: string;
};

export type CapabilityResolution = {
  requested: ReadonlyArray<string>;
  resolved: ReadonlyArray<CapabilityRef>;
  missing: ReadonlyArray<string>;
};
