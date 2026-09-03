import { Badge, SectionHead } from '@/components/terminal';

export function AgentReadinessPanel() {
  return (
    <section className="mb-6 rounded-lg-t border border-os-border bg-os-surface p-5">
      <SectionHead label="Agent operating contract" count="always-ready · dormant when unused" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-sm-t border border-os-border bg-os-surface2 p-4"><Badge tone="ok">READY</Badge><h3 className="mt-3 text-[16px] font-semibold">Wake on demand</h3><p className="mt-2 text-sm leading-6 text-os-muted">Agents stay idle when unused and run live connector checks when invoked. A failed connector is reported instead of masked.</p></div>
        <div className="rounded-sm-t border border-os-border bg-os-surface2 p-4"><Badge tone="ok">MEMORY</Badge><h3 className="mt-3 text-[16px] font-semibold">Learn from approved work</h3><p className="mt-2 text-sm leading-6 text-os-muted">Requests and replies are retained in the agent memory trail so future work can use prior context. This is auditable memory, not unreviewed self-training.</p></div>
        <div className="rounded-sm-t border border-os-border bg-os-surface2 p-4"><Badge tone="warn">REVIEW</Badge><h3 className="mt-3 text-[16px] font-semibold">Safe updates</h3><p className="mt-2 text-sm leading-6 text-os-muted">Agents can recommend new skills, connectors, and workflows. Publishing, permissions, and structural changes still require your approval.</p></div>
      </div>
    </section>
  );
}
