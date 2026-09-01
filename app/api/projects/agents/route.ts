import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export async function GET(request: Request) { const projectId = new URL(request.url).searchParams.get('projectId') || undefined; return NextResponse.json({ assignments: getDb().projectAgents.all(projectId) }); }
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); if (!body.projectId || !body.agentId) return NextResponse.json({ error: 'projectId and agentId are required' }, { status: 400 }); getDb().projectAgents.assign(body.projectId, body.agentId); return NextResponse.json({ assigned: true }, { status: 201 }); }
export async function DELETE(request: Request) { const body = await request.json().catch(() => ({})); if (!body.projectId || !body.agentId) return NextResponse.json({ error: 'projectId and agentId are required' }, { status: 400 }); getDb().projectAgents.remove(body.projectId, body.agentId); return NextResponse.json({ removed: true }); }
