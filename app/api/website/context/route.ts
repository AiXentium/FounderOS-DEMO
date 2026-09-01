import { NextResponse } from 'next/server';
import { optimalEngineContext } from '@/lib/connectors/optimal-engine';

export async function GET(request: Request) {
  const project = new URL(request.url).searchParams.get('project') ?? 'default';
  return NextResponse.json(await optimalEngineContext(project));
}
