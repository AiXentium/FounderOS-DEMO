import type { ConnectorStatus } from '@/lib/connectors/types';

/** Optional bridge to the separate OptimalEngine repository. Demo mode stays
 * local until OPTIMAL_ENGINE_URL is supplied for a cloned/deployed instance. */
export function optimalEngineStatus(): ConnectorStatus {
  const url = process.env.OPTIMAL_ENGINE_URL;
  if (!url) return { id: 'optimal-engine', name: 'Optimal Engine', kind: 'knowledge', state: 'not_configured', detail: 'Set OPTIMAL_ENGINE_URL when the companion service is deployed.' };
  return { id: 'optimal-engine', name: 'Optimal Engine', kind: 'knowledge', state: 'connected', detail: `Companion memory service configured at ${new URL(url).hostname}` };
}

export async function optimalEngineContext(project = 'default'): Promise<{ project: string; mode: 'local' | 'remote'; context: string }> {
  const url = process.env.OPTIMAL_ENGINE_URL;
  if (!url) return { project, mode: 'local', context: 'Founder OS local G-Brain context' };
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/api/context?project=${encodeURIComponent(project)}`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { project, mode: 'remote', context: JSON.stringify(await response.json()) };
  } catch {
    return { project, mode: 'local', context: 'Remote unavailable; using Founder OS local context' };
  }
}
