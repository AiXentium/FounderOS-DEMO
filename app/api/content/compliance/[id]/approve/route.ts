import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { buildCompliancePayload, reviewStatus, type CompliancePayload } from '@/lib/content-compliance';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const current = db.contentComplianceReviews.byId((await context.params).id) as { id: string; title: string; content_kind: string; contentKind?: string; platforms: string[]; payload: CompliancePayload; status: string; createdAt: string; updatedAt: string } | null;
  if (!current) return NextResponse.json({ error: 'review not found' }, { status: 404 });
  const payload = buildCompliancePayload({ platforms: current.platforms, affiliate: current.payload.affiliate, claims: current.payload.claims, assets: current.payload.assets, originality: current.payload.originality, controls: { ...current.payload.controls, humanApproved: true }, accountHealth: db.contentAccountHealth.state(current.platforms), policyVersion: current.payload.policyVersion });
  const status = reviewStatus(payload);
  if (status !== 'approved') return NextResponse.json({ error: 'Review is not ready for approval', review: { ...current, payload, status } }, { status: 409 });
  const review = { id: current.id, title: current.title, contentKind: current.contentKind ?? current.content_kind, platforms: current.platforms, payload, status, createdAt: current.createdAt, updatedAt: new Date().toISOString() };
  db.contentComplianceReviews.save(review);
  return NextResponse.json({ review });
}
