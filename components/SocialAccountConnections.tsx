'use client';

import { useEffect, useState } from 'react';

type Account = {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  profileUrl?: string;
  isActive: boolean;
  status?: string;
};

const channels = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
] as const;

export function SocialAccountConnections({ initialAccounts = [] }: { initialAccounts?: Account[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [loading, setLoading] = useState(initialAccounts.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/social/accounts')
      .then(async (response) => {
        const body = await response.json() as { accounts?: Account[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
        if (live) setAccounts(body.accounts ?? []);
      })
      .catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : String(reason)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return (
    <section className="mb-6 rounded-lg-t border border-os-border bg-os-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-os-accent">Live publishing accounts</div>
          <h2 className="mt-1 text-[16px] font-semibold">Instagram + Facebook</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-os-dim">Connect each account through Zernio OAuth. Once connected, the composer can publish or schedule to the real account ID.</p>
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${accounts.length ? 'text-os-ok' : 'text-os-warn'}`}>
          {loading ? 'checking…' : accounts.length ? `${accounts.length} connected` : 'action required'}
        </span>
      </div>
      {error && <p className="mt-3 font-mono text-[10px] text-os-err">{error}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {channels.map((channel) => {
          const matches = accounts.filter((account) => account.platform === channel.id && account.isActive && account.status !== 'disconnected');
          return (
            <div key={channel.id} className="flex items-center justify-between gap-3 rounded-sm-t border border-os-border px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold">{channel.label}</div>
                <div className="truncate font-mono text-[10px] text-os-dim">{matches.length ? matches.map((account) => account.username || account.displayName || 'connected').join(', ') : 'not connected'}</div>
              </div>
              <a href={`/api/social/connect/${channel.id}`} className="shrink-0 rounded-sm-t border border-os-border-strong px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-os-text hover:bg-os-surface2">
                {matches.length ? 'Reconnect' : 'Connect'}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
