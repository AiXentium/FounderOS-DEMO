import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { buildCompliancePayload, reviewStatus, type ClaimRecord, type ComplianceControls, type CompliancePayload, type OriginalityInput, type ProvenanceRecord } from '@/lib/content-compliance';

export const dynamic = 'force-dynamic';

const ClaimSchema = z.object({ text: z.string().trim().min(1).max(1000), source: z.string().trim().max(1000), checkedAt: z.string().trim().max(40), confidence: z.enum(['high', 'medium', 'low']), reviewerApproved: z.boolean() });
const AssetSchema = z.object({ id: z.string().min(1), assetName: z.string().min(1), assetType: z.string().min(1), source: z.string().min(1), rightsStatus: z.enum(['cleared', 'pending', 'restricted', 'unknown']), license: z.string(), expiresAt: z.string().nullable(), attribution: z.string(), notes: z.string() });
const ControlsSchema = z.object({ rightsCleared: z.boolean().optional(), claimsSubstantiated: z.boolean().optional(), disclosurePresent: z.boolean().optional(), disclosurePlacement: z.enum(['video', 'caption', 'email', 'page', 'near_recommendation', '']).optional(), platformReviewed: z.boolean().optional(), humanApproved: z.boolean().optional() });
const OriginalitySchema = z.object({ originalResearch: z.boolean().optional(), newCommentary: z.boolean().optional(), distinctScript: z.boolean().optional(), meaningfulEditing: z.boolean().optional(), uniqueVisuals: z.boolean().optional(), educationalValue: z.boolean().optional() });
const UpdateSchema = z.object({ claims: z.array(ClaimSchema).max(30).optional(), assets: z.array(AssetSchema).max(100).optional(), controls: ControlsSchema.optional(), originality: OriginalitySchema.optional() });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const review = getDb().contentComplianceReviews.byId((await context.params).id);
  return review ? NextResponse.json({ review }) : NextResponse.json({ error: 'review not found' }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = UpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const id = (await context.params).id;
  const current = db.contentComplianceReviews.byId(id) as { id: string; title: string; content_kind: string; contentKind?: string; platforms: string[]; payload: CompliancePayload; status: string; createdAt: string; updatedAt: string } | null;
  if (!current) return NextResponse.json({ error: 'review not found' }, { status: 404 });
  const payload = buildCompliancePayload({
    platforms: current.platforms,
    affiliate: current.payload.affiliate,
    claims: (parsed.data.claims ?? current.payload.claims) as ClaimRecord[],
    assets: (parsed.data.assets ?? current.payload.assets) as ProvenanceRecord[],
    originality: { ...current.payload.originality, ...parsed.data.originality } as OriginalityInput,
    controls: { ...current.payload.controls, ...parsed.data.controls } as ComplianceControls,
    accountHealth: db.contentAccountHealth.state(current.platforms),
    policyVersion: current.payload.policyVersion,
  });
  const updatedAt = new Date().toISOString();
  const review = { id: current.id, title: current.title, contentKind: current.contentKind ?? current.content_kind, platforms: current.platforms, payload, status: reviewStatus(payload), createdAt: current.createdAt, updatedAt };
  db.contentComplianceReviews.save(review);
  return NextResponse.json({ review });
}
