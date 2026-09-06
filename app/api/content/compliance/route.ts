import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { buildCompliancePayload, reviewStatus, type ClaimRecord, type ComplianceControls, type OriginalityInput, type ProvenanceRecord } from '@/lib/content-compliance';
import { CONTENT_POLICY_SOURCES, POLICY_UPDATE_LOOP } from '@/lib/content-policy';

export const dynamic = 'force-dynamic';

const ClaimSchema = z.object({ text: z.string().trim().min(1).max(1000), source: z.string().trim().max(1000), checkedAt: z.string().trim().max(40), confidence: z.enum(['high', 'medium', 'low']), reviewerApproved: z.boolean() });
const AssetSchema = z.object({ id: z.string().min(1), assetName: z.string().min(1), assetType: z.string().min(1), source: z.string().min(1), rightsStatus: z.enum(['cleared', 'pending', 'restricted', 'unknown']), license: z.string(), expiresAt: z.string().nullable(), attribution: z.string(), notes: z.string() });
const ControlsSchema = z.object({ rightsCleared: z.boolean(), claimsSubstantiated: z.boolean(), disclosurePresent: z.boolean(), disclosurePlacement: z.enum(['video', 'caption', 'email', 'page', 'near_recommendation', '']), platformReviewed: z.boolean(), humanApproved: z.boolean() });
const OriginalitySchema = z.object({ originalResearch: z.boolean(), newCommentary: z.boolean(), distinctScript: z.boolean(), meaningfulEditing: z.boolean(), uniqueVisuals: z.boolean(), educationalValue: z.boolean() });
const CreateSchema = z.object({
  title: z.string().trim().min(3).max(240),
  contentKind: z.string().trim().min(1).max(80).default('video'),
  platforms: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
  affiliate: z.boolean().default(true),
  claims: z.array(ClaimSchema).max(30).default([]),
  assets: z.array(AssetSchema).max(100).default([]),
  originality: OriginalitySchema,
  controls: ControlsSchema,
});

export async function GET() {
  const db = getDb();
  return NextResponse.json({ reviews: db.contentComplianceReviews.all(), policies: CONTENT_POLICY_SOURCES, updateLoop: POLICY_UPDATE_LOOP });
}

export async function POST(request: Request) {
  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const payload = buildCompliancePayload({ ...parsed.data, claims: parsed.data.claims as ClaimRecord[], assets: parsed.data.assets as ProvenanceRecord[], originality: parsed.data.originality as OriginalityInput, controls: parsed.data.controls as ComplianceControls, accountHealth: db.contentAccountHealth.state(parsed.data.platforms) });
  const now = new Date().toISOString();
  const review = { id: randomUUID(), title: parsed.data.title, contentKind: parsed.data.contentKind, platforms: parsed.data.platforms, payload, status: reviewStatus(payload), createdAt: now, updatedAt: now };
  db.contentComplianceReviews.save(review);
  return NextResponse.json({ review }, { status: 201 });
}
