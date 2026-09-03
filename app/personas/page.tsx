import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { PersonasViewer } from '@/components/PersonasViewer';
import { Badge } from '@/components/terminal';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function PersonasPage() {
  const personas = getDb().personas.all();

  return (
    <div>
      <PageHeader
        eyebrow="platform variants"
        title="Personas"
        right={<Badge tone="accent">{personas.length} templates</Badge>}
      />
      <section className="mb-6 rounded-lg-t border border-[var(--accent-line)] bg-os-accent/5 p-5"><div className="font-mono text-[11px] uppercase tracking-widest text-os-accent">Business variant layer</div><h2 className="mt-1 text-[20px] font-semibold">What Personas does</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-os-muted">A persona is a configurable operating blueprint for a type of business. It defines the goals, pillars, useful connectors, measurements, and signature plays that G-Brain should use when coordinating agents. Selecting a persona is a planning reference; it does not replace your live business data or silently provision agents.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/setup" className="rounded-sm-t border border-os-border px-3 py-2 font-mono text-[11px] uppercase text-os-accent">Configure with Concierge</Link><Link href="/roadmap" className="rounded-sm-t border border-os-border px-3 py-2 font-mono text-[11px] uppercase text-os-accent">Review blueprint</Link><Link href="/doctor" className="rounded-sm-t border border-os-border px-3 py-2 font-mono text-[11px] uppercase text-os-accent">Check readiness</Link></div></section>
      <PersonasViewer personas={personas} />
    </div>
  );
}
