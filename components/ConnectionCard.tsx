import { ExternalLink } from 'lucide-react';
import { BrandLogo } from '@/lib/brand-logos';
import { connectKeysFor, type CatalogEntry } from '@/lib/integrations-catalog';
import { ConnectFlow } from '@/components/ConnectFlow';

/**
 * One integration tile in the connections marketplace: rounded card, brand
 * logo, name + blurb, and a LIVE footer — Connect opens a paste-a-key form
 * that writes .env.local through /api/connections/connect; connected state
 * always comes from the real connector, never the stored key alone.
 */
export function ConnectionCard({ entry, guidance }: { entry: CatalogEntry; guidance?: string }) {
  const mcp = ['wordpress', 'elementor', 'viator'].includes(entry.slug);
  const api = (entry.envKeys?.length ?? 0) > 0;
  const mode = mcp && api ? 'MCP + API' : mcp ? 'MCP' : api ? 'API key' : 'OAuth / provider setup';
  return (
    <div className="group flex min-h-[112px] flex-col justify-between rounded-2xl border border-os-border bg-os-surface p-4 transition-colors hover:border-os-border-strong">
      <div className="flex items-start gap-3">
        <BrandLogo slug={entry.slug} name={entry.name} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5"><div className="truncate text-[13.5px] font-semibold leading-tight text-os-text">{entry.name}</div>{entry.externalUrl && <a href={entry.externalUrl} target="_blank" rel="noreferrer" title={`Open ${entry.name}`} className="text-os-dim hover:text-os-accent"><ExternalLink className="h-3 w-3" /></a>}</div>
          <div className="mt-1 truncate text-[11px] leading-tight text-os-dim">{entry.tagline}</div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-os-accent">Connection: {mode}</div>
        </div>
      </div>

      <ConnectFlow
        slug={entry.slug}
        connected={entry.connected}
        keySaved={entry.keySaved}
        keys={connectKeysFor(entry)}
        oauthProvider={entry.oauthProvider}
      guidance={guidance}
      />
    </div>
  );
}
