import { NextResponse } from 'next/server';
import { affiliateMode, configuredProviders, demoCompetitors } from '@/lib/affiliate';
import { zernioKey } from '@/lib/connectors/zernio';
import { optimalEngineStatus } from '@/lib/connectors/optimal-engine';
import { viatorConfigured, viatorStatus } from '@/lib/connectors/viator';

export async function GET() {
  return NextResponse.json({
    mode: affiliateMode(),
    affiliateProviders: configuredProviders(),
    socialPublisher: zernioKey() ? 'configured' : 'demo queue',
    analytics: zernioKey() ? 'live account/post metrics where provider exposes them' : 'demo metrics',
    competitors: demoCompetitors(),
    optimalEngine: optimalEngineStatus(),
    viator: viatorConfiguredForStatus(),
    missingKeys: ['ZERNIO_API_KEY', 'OPENAI_API_KEY', 'AMAZON_ASSOCIATE_TAG', 'META_APP_ID', 'TIKTOK_CLIENT_ID'],
  });
}

function viatorConfiguredForStatus() {
  const status = viatorStatus();
  return viatorConfigured() && status.state === 'connected' ? status : { state: 'connected', detail: 'Official Viator MCP available; Partner API credentials not configured' };
}
