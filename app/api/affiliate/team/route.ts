import { NextResponse } from 'next/server';
import { affiliateStudioTeam, affiliateStudioWorkflow } from '@/lib/affiliate-team';

export async function GET() {
  return NextResponse.json({ team: affiliateStudioTeam, workflow: affiliateStudioWorkflow, approvalRequired: true });
}
