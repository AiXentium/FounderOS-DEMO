'use client';

import { useEffect, useState } from 'react';

type Team = { agents: unknown[]; skills: unknown[]; tools: unknown[]; connectors: { state: string }[]; brain: unknown[] };

export function WebsiteTeamPanel() {
  const [team, setTeam] = useState<Team | null>(null);
  useEffect(() => { fetch('/api/website/team').then((r) => r.json()).then(setTeam).catch(() => setTeam(null)); }, []);
  if (!team) return null;
  const connected = team.connectors.filter((c) => c.state === 'connected').length;
  return <section className="mb-6 rounded-lg-t border border-os-border bg-os-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-os-dim">Website Builder team</div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">{[['Agents', team.agents.length], ['Skills', team.skills.length], ['Tools', team.tools.length], ['Connected', `${connected}/${team.connectors.length}`], ['Brain results', team.brain.length]].map(([label, value]) => <div key={label} className="rounded-sm-t border border-os-border bg-os-surface2 p-2"><div className="font-mono text-[9px] uppercase text-os-dim">{label}</div><div className="mt-1 font-mono text-[15px] text-os-accent">{value}</div></div>)}</div><div className="mt-3 font-mono text-[10px] text-os-muted">Live shared context: new agents, skills, tools, connectors, and projects appear automatically.</div></section>;
}
