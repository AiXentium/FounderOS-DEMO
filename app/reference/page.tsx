import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { allConnectorStatuses } from '@/lib/connectors';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReferencePage() {
  const db = getDb();
  const domains = db.domains.all();
  const statuses = await allConnectorStatuses();
  const connected = statuses.filter((status) => status.state === 'connected').length;

  return (
    <div>
      <PageHeader
        eyebrow="operating domains"
        title="Reference Model"
      />
      <section className="mb-7 rounded-lg-t border border-[var(--accent-line)] bg-os-accent/5 p-5"><div className="font-mono text-[11px] uppercase tracking-widest text-os-accent">Operating map · monitored reference</div><h2 className="mt-1 text-[20px] font-semibold">What this page is for</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-os-muted">This is the shared map of the business: which domain owns each responsibility, which agents and skills support it, and which live connections it depends on. It is a reference and review surface—not an execution button.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/doctor" className="rounded-sm-t border border-os-border px-3 py-2 font-mono text-[11px] uppercase text-os-accent">Open Doctor audit</Link><Link href="/setup" className="rounded-sm-t border border-os-border px-3 py-2 font-mono text-[11px] uppercase text-os-accent">Ask Concierge</Link><span className="rounded-sm-t border border-os-border bg-os-surface px-3 py-2 font-mono text-[11px] text-os-dim">{connected}/{statuses.length} connectors live · {db.agents.all().length} agents · {db.skills.all().length} skills</span></div></section>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4 ultra:grid-cols-6">
        {domains.map((domain) => (
          <div key={domain.id} className="hoverable rounded-lg-t border border-os-border bg-os-surface px-[17px] py-[15px]">
            <div className="font-mono text-[10px] tracking-[0.14em] text-os-accent">
              {String(domain.number).padStart(2, '0')}
            </div>
            <h2 className="mt-1.5 text-[13.5px] font-bold">{domain.title}</h2>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {domain.items.map((item) => (
                <li
                  key={item}
                  className="rounded-sm-t border border-os-border bg-os-surface2 px-[9px] py-1.5 font-mono text-[10.5px] text-os-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
