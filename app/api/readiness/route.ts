import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { systemContext } from '@/lib/system-context';
export async function GET() { const db = getDb(); const context = await systemContext(); return NextResponse.json({ ok: true, local: { database: 'ready', sharedContext: 'ready', agents: context.agents.length, products: context.products.length, campaigns: context.campaigns.length, websiteProjects: context.websiteProjects.length, assets: 'ready', brain: 'available' }, external: 'credentials optional' }); }
