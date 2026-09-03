export type RevenueEntityType =
  | 'business'
  | 'person'
  | 'company'
  | 'audience-segment'
  | 'offer'
  | 'campaign'
  | 'experiment'
  | 'creative'
  | 'content-asset'
  | 'web-experience'
  | 'touch'
  | 'lead'
  | 'conversation'
  | 'opportunity'
  | 'deal'
  | 'customer'
  | 'order'
  | 'payment'
  | 'revenue'
  | 'cost'
  | 'margin'
  | 'retention-event'
  | 'referral';

export type RevenueEntity = {
  id: string;
  type: RevenueEntityType;
  businessId: string;
  label: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type RevenueEdge = {
  fromId: string;
  toId: string;
  relationship: string;
  at: string;
};

export class RevenueSpine {
  private readonly entities = new Map<string, RevenueEntity>();
  private readonly edges: RevenueEdge[] = [];

  upsert(entity: RevenueEntity): void {
    this.entities.set(entity.id, { ...entity, metadata: entity.metadata ? { ...entity.metadata } : undefined });
  }

  connect(edge: RevenueEdge): void {
    if (!this.entities.has(edge.fromId)) throw new Error(`unknown revenue entity: ${edge.fromId}`);
    if (!this.entities.has(edge.toId)) throw new Error(`unknown revenue entity: ${edge.toId}`);
    const duplicate = this.edges.some((existing) => existing.fromId === edge.fromId && existing.toId === edge.toId && existing.relationship === edge.relationship);
    if (!duplicate) this.edges.push({ ...edge });
  }

  get(id: string): RevenueEntity | undefined {
    return this.entities.get(id);
  }

  all(): RevenueEntity[] {
    return [...this.entities.values()];
  }

  linksFor(id: string): RevenueEdge[] {
    return this.edges.filter((edge) => edge.fromId === id || edge.toId === id);
  }

  traceForward(startId: string, maxDepth = 20): RevenueEntity[] {
    const seen = new Set<string>([startId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
    const output: RevenueEntity[] = [];
    while (queue.length) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;
      for (const edge of this.edges.filter((candidate) => candidate.fromId === current.id)) {
        if (seen.has(edge.toId)) continue;
        seen.add(edge.toId);
        const entity = this.entities.get(edge.toId);
        if (entity) output.push(entity);
        queue.push({ id: edge.toId, depth: current.depth + 1 });
      }
    }
    return output;
  }

  traceRevenueFrom(sourceId: string): RevenueEntity[] {
    return this.traceForward(sourceId).filter((entity) => ['payment', 'revenue', 'margin'].includes(entity.type));
  }
}
