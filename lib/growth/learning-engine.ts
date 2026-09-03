export type LearningEvidence = {
  sourceType: 'experiment' | 'campaign' | 'sales' | 'customer' | 'finance' | 'website' | 'search';
  sourceId: string;
  metric?: string;
  before?: number;
  after?: number;
  notes?: string;
};

export type GrowthLesson = {
  id: string;
  businessId: string;
  statement: string;
  confidence: 'low' | 'medium' | 'high';
  evidence: LearningEvidence[];
  status: 'candidate' | 'verified' | 'rejected';
  tags: string[];
  createdAt: string;
};

export class LearningEngine {
  private readonly lessons = new Map<string, GrowthLesson>();

  propose(lesson: GrowthLesson): void {
    if (!lesson.evidence.length) throw new Error('growth lesson requires evidence');
    this.lessons.set(lesson.id, { ...lesson, evidence: lesson.evidence.map((item) => ({ ...item })) });
  }

  verify(id: string, minimumIndependentEvidence = 1): GrowthLesson {
    const lesson = this.lessons.get(id);
    if (!lesson) throw new Error(`unknown lesson: ${id}`);
    const independent = new Set(lesson.evidence.map((item) => `${item.sourceType}:${item.sourceId}`));
    if (independent.size < minimumIndependentEvidence) throw new Error('insufficient independent evidence to verify lesson');
    const verified = { ...lesson, status: 'verified' as const };
    this.lessons.set(id, verified);
    return verified;
  }

  reject(id: string): GrowthLesson {
    const lesson = this.lessons.get(id);
    if (!lesson) throw new Error(`unknown lesson: ${id}`);
    const rejected = { ...lesson, status: 'rejected' as const };
    this.lessons.set(id, rejected);
    return rejected;
  }

  verifiedForBusiness(businessId: string): GrowthLesson[] {
    return [...this.lessons.values()].filter((lesson) => lesson.businessId === businessId && lesson.status === 'verified');
  }
}
