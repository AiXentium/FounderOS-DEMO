import { NextResponse } from 'next/server';
import { aiProviderStatus } from '@/lib/ai-studio';
export async function GET() { return NextResponse.json(aiProviderStatus()); }
