import type { CapabilityRef, SuperAgentRole } from './contracts';

export type CapabilityStatus = 'live' | 'learning' | 'planned' | 'unavailable';
export type CapabilityRisk = 'read' | 'draft' | 'write' | 'high-impact';

export type RegisteredCapability = CapabilityRef & {
  name: string;
  description: string;
  tags: string[];
  status: CapabilityStatus;
  risk: CapabilityRisk;
  defaultOwners: SuperAgentRole[];
  dependencies: string[];
  estimatedCostClass: 'free' | 'low' | 'medium' | 'high' | 'unknown';
};

export type CapabilityQuery = {
  ids?: string[];
  tags?: string[];
  kinds?: CapabilityRef['kind'][];
  statuses?: CapabilityStatus[];
  maxRisk?: CapabilityRisk;
};

const RISK_ORDER: Record<CapabilityRisk, number> = {
  read: 0,
  draft: 1,
  write: 2,
  'high-impact': 3,
};

export class CapabilityRegistry {
  private readonly items = new Map<string, RegisteredCapability>();

  constructor(seed: RegisteredCapability[] = []) {
    for (const capability of seed) this.register(capability);
  }

  register(capability: RegisteredCapability): void {
    if (!capability.id.trim()) throw new Error('capability id is required');
    if (this.items.has(capability.id)) throw new Error(`duplicate capability: ${capability.id}`);
    this.items.set(capability.id, Object.freeze({ ...capability }));
  }

  get(id: string): RegisteredCapability | undefined {
    return this.items.get(id);
  }

  all(): RegisteredCapability[] {
    return [...this.items.values()];
  }

  find(query: CapabilityQuery): RegisteredCapability[] {
    return this.all().filter((item) => {
      if (query.ids?.length && !query.ids.includes(item.id)) return false;
      if (query.kinds?.length && !query.kinds.includes(item.kind)) return false;
      if (query.statuses?.length && !query.statuses.includes(item.status)) return false;
      if (query.tags?.length && !query.tags.every((tag) => item.tags.includes(tag))) return false;
      if (query.maxRisk && RISK_ORDER[item.risk] > RISK_ORDER[query.maxRisk]) return false;
      return true;
    });
  }

  resolve(ids: string[]): { resolved: RegisteredCapability[]; missing: string[] } {
    const resolved: RegisteredCapability[] = [];
    const missing: string[] = [];
    for (const id of ids) {
      const item = this.get(id);
      if (!item || item.status === 'unavailable') missing.push(id);
      else resolved.push(item);
    }
    return { resolved, missing };
  }
}

export const PORTABLE_CAPABILITIES: RegisteredCapability[] = [
  { id: 'knowledge.retrieval', kind: 'skill', name: 'Knowledge retrieval', description: 'Retrieve approved business context from the shared knowledge layer.', tags: ['knowledge','shared'], status: 'live', risk: 'read', defaultOwners: ['tbrain'], dependencies: ['gbrain'], estimatedCostClass: 'low' },
  { id: 'planning.goal-decomposition', kind: 'skill', name: 'Goal decomposition', description: 'Convert a business objective into measurable outcomes and bounded workstreams.', tags: ['planning','executive','shared'], status: 'learning', risk: 'draft', defaultOwners: ['tbrain','ceo','chief-of-staff'], dependencies: [], estimatedCostClass: 'low' },
  { id: 'planning.team-composition', kind: 'service', name: 'Team composition', description: 'Select the smallest capable team for a mission from registered capabilities.', tags: ['orchestration','shared'], status: 'learning', risk: 'draft', defaultOwners: ['tbrain','chief-of-staff'], dependencies: [], estimatedCostClass: 'free' },
  { id: 'evaluation.judge', kind: 'service', name: 'Independent judge', description: 'Evaluate evidence against explicit success criteria without self-certification by the worker.', tags: ['evaluation','quality','shared'], status: 'planned', risk: 'read', defaultOwners: ['tbrain','ceo'], dependencies: [], estimatedCostClass: 'low' },
  { id: 'sales.outbound', kind: 'skill', name: 'Cold outbound sequencing', description: 'Existing multi-touch outbound capability.', tags: ['sales','growth'], status: 'live', risk: 'write', defaultOwners: ['cro','cmo'], dependencies: ['postly','dmflow'], estimatedCostClass: 'low' },
  { id: 'sales.reply-qualification', kind: 'skill', name: 'Reply qualification', description: 'Existing reply scoring and qualification capability.', tags: ['sales','crm'], status: 'live', risk: 'draft', defaultOwners: ['cro'], dependencies: ['dmflow','gmail'], estimatedCostClass: 'low' },
  { id: 'sales.proposal-drafting', kind: 'skill', name: 'Proposal drafting', description: 'Draft proposals from approved sales context.', tags: ['sales','proposal'], status: 'learning', risk: 'draft', defaultOwners: ['cro'], dependencies: ['proposal-gen','ledger'], estimatedCostClass: 'low' },
  { id: 'marketing.hook-writing', kind: 'skill', name: 'Hook writing', description: 'Existing short-form hook and caption generation.', tags: ['marketing','content'], status: 'live', risk: 'draft', defaultOwners: ['cmo','creative-director'], dependencies: ['postly'], estimatedCostClass: 'low' },
  { id: 'marketing.ugc-generation', kind: 'skill', name: 'UGC generation', description: 'Existing ad-ready UGC generation capability.', tags: ['marketing','creative','ugc'], status: 'live', risk: 'draft', defaultOwners: ['cmo','ugc-studio','creative-director'], dependencies: ['adsmith'], estimatedCostClass: 'medium' },
  { id: 'marketing.video-editing', kind: 'skill', name: 'Video editing', description: 'Existing programmatic reel and highlight editing.', tags: ['marketing','creative','video'], status: 'live', risk: 'draft', defaultOwners: ['creative-director','ugc-studio'], dependencies: ['reelkit'], estimatedCostClass: 'low' },
  { id: 'marketing.cross-post', kind: 'skill', name: 'Cross-post scheduling', description: 'Existing multi-platform queue and publishing capability.', tags: ['marketing','publishing'], status: 'live', risk: 'write', defaultOwners: ['cmo'], dependencies: ['postly'], estimatedCostClass: 'low' },
  { id: 'marketing.social-analysis', kind: 'skill', name: 'Social performance analysis', description: 'Analyze measured social performance and recommend experiments.', tags: ['marketing','analytics'], status: 'learning', risk: 'read', defaultOwners: ['cmo'], dependencies: ['zernio','gbrain'], estimatedCostClass: 'low' },
  { id: 'website.seo-brief', kind: 'skill', name: 'SEO content brief', description: 'Existing search-intent and internal-link planning capability.', tags: ['website','seo','content'], status: 'learning', risk: 'draft', defaultOwners: ['website','cmo'], dependencies: ['gbrain'], estimatedCostClass: 'low' },
  { id: 'website.wordpress-publish', kind: 'skill', name: 'WordPress publishing', description: 'Prepare and publish approved WordPress changes with exact diff evidence.', tags: ['website','wordpress','publishing'], status: 'planned', risk: 'write', defaultOwners: ['website'], dependencies: ['wordpress','elementor'], estimatedCostClass: 'low' },
  { id: 'website.visual-qa', kind: 'service', name: 'Website visual QA', description: 'Render, inspect, critique and repair page output against responsive and conversion criteria.', tags: ['website','quality','visual'], status: 'planned', risk: 'read', defaultOwners: ['website','creative-director'], dependencies: [], estimatedCostClass: 'medium' },
  { id: 'finance.payment-reconciliation', kind: 'skill', name: 'Payment reconciliation', description: 'Match processor payouts and business records.', tags: ['finance','payments'], status: 'planned', risk: 'read', defaultOwners: ['cfo'], dependencies: ['stripe','paykit'], estimatedCostClass: 'low' },
  { id: 'analytics.revenue-attribution', kind: 'skill', name: 'Revenue attribution', description: 'Tie marketing and sales activity to measured revenue.', tags: ['analytics','revenue','marketing','sales'], status: 'planned', risk: 'read', defaultOwners: ['cfo','cmo','cro'], dependencies: ['trakyo','ghl'], estimatedCostClass: 'low' },
  { id: 'ops.inbox-triage', kind: 'skill', name: 'Inbox triage', description: 'Existing priority and routing capability for inbound communications.', tags: ['ops','communications'], status: 'live', risk: 'read', defaultOwners: ['chief-of-staff','customer-success'], dependencies: ['gmail'], estimatedCostClass: 'low' },
  { id: 'ops.workflow-optimization', kind: 'skill', name: 'Workflow optimization', description: 'Diagnose bottlenecks, capacity and handoff problems in business workflows.', tags: ['ops','process'], status: 'planned', risk: 'draft', defaultOwners: ['coo'], dependencies: [], estimatedCostClass: 'low' },
  { id: 'technology.architecture-review', kind: 'skill', name: 'Architecture review', description: 'Assess proposed technical changes for boundary, reliability, security and rollback risk.', tags: ['technology','engineering','governance'], status: 'planned', risk: 'draft', defaultOwners: ['cto'], dependencies: [], estimatedCostClass: 'low' },
  { id: 'customer.account-health', kind: 'skill', name: 'Account health analysis', description: 'Score client health from service, communication, renewal and risk signals.', tags: ['customer-success','analytics'], status: 'planned', risk: 'read', defaultOwners: ['customer-success'], dependencies: ['ledger'], estimatedCostClass: 'low' },
];

export function createPortableCapabilityRegistry(): CapabilityRegistry {
  return new CapabilityRegistry(PORTABLE_CAPABILITIES);
}
