import type { FounderDb } from '@/lib/db';
import { syncSocialSnapshots } from '@/lib/social';
import { zernioLiveAccounts } from '@/lib/connectors/zernio';

type FollowerMap = Record<string, { handle?: string; followers?: number }>;

type LiveSyncOpts = {
  today?: string;
  /** Live follower source; defaults to the Zernio/Late `/v1/accounts` fetch. */
  source?: () => Promise<FollowerMap>;
};

/**
 * Pull live follower counts from Zernio/Late and snapshot them for today.
 * Replaces the old read-time `syncFromZernioConfig`, which only ever copied
 * stale static numbers out of config.json. If the live API is unreachable or
 * returns nothing, no snapshot is written. Same-day re-sync overwrites.
 */
export async function syncFromZernioLive(db: FounderDb, opts: LiveSyncOpts = {}): Promise<number> {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const source = opts.source ?? zernioLiveAccounts;

  let accounts: FollowerMap = {};
  try {
    accounts = await source();
  } catch {
    accounts = {};
  }
  if (Object.keys(accounts).length === 0) return 0;
  return syncSocialSnapshots(db, accounts, today);
}
