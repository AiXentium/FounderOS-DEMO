import type { ReactNode } from 'react';
import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { WorkflowMap } from '@/components/WorkflowMap';
import { BrandLogo } from '@/lib/brand-logos';
import { toolBrand } from '@/lib/workflow-tool-brands';

export const dynamic = 'force-dynamic';

export default function WorkflowsPage() {
  const workflows = getDb().workflows.all();
  // Render the company logos here, server-side: BrandLogo pulls simple-icons,
  // which must never enter the client bundle. The map receives ready-made nodes.
  const toolIds = new Set(workflows.flatMap((w) => w.steps.flatMap((s) => s.tools)));
  const toolLogos: Record<string, ReactNode> = {};
  for (const id of toolIds) {
    const b = toolBrand(id);
    toolLogos[id] = <BrandLogo slug={b.slug} name={b.name} size={14} />;
  }
  return (
    <div>
      <PageHeader eyebrow="process map" title="Workflows" />
      <section className="mb-5 rounded-lg-t border border-os-border bg-os-surface p-4">
        <div className="font-mono text-[13px] uppercase tracking-[0.14em] text-os-accent">How this works</div>
        <p className="mt-2 max-w-4xl text-[16px] leading-relaxed text-os-copy">
          These maps are operating blueprints for the Business OS execution lanes. They do not claim that a run occurred;
          actual execution belongs in Job Operations and is shown only from recorded job evidence. They run through the OS agent and workflow executor;
          this page is not an n8n editor. n8n can be added as an external bridge for webhooks, schedules, or services
          without a native connector. Every external publishing step remains approval-gated.
        </p>
        <div className="mt-3 grid gap-2 text-[15px] sm:grid-cols-3">
          <div className="rounded-sm-t border border-os-border bg-os-bg2 p-3"><span className="font-semibold">Business OS</span><div className="mt-1 text-os-dim">Agents, approvals, shared context</div></div>
          <div className="rounded-sm-t border border-os-border bg-os-bg2 p-3"><span className="font-semibold">Connected tools</span><div className="mt-1 text-os-dim">WordPress, Viator, Zernio, Calendar</div></div>
          <div className="rounded-sm-t border border-os-border bg-os-bg2 p-3"><span className="font-semibold">n8n bridge</span><div className="mt-1 text-os-dim">Optional webhooks and schedules</div></div>
        </div>
      </section>
      <WorkflowMap workflows={workflows} toolLogos={toolLogos} />
    </div>
  );
}
