import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/data';

export async function GET() { return NextResponse.json({ workspaces: getDb().workspaces.all() }); }
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); if (!body.name || typeof body.name !== 'string') return NextResponse.json({ error: 'name is required' }, { status: 400 }); const now = new Date().toISOString(); const id = randomUUID(); const slug = (body.slug || body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || id; getDb().workspaces.save({ id, name: body.name.trim(), slug, createdAt: now, updatedAt: now }); return NextResponse.json({ workspace: { id, name: body.name.trim(), slug } }, { status: 201 }); }
