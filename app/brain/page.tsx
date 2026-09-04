import { readStoreNotes } from '@/lib/connectors/gbrain';
import type { RosterClient } from '@/lib/schemas';
import { buildBrainGraph } from '@/lib/brain-graph';
import { buildKnowledgeGraph } from '@/lib/knowledge-graph';
import { distillMemoryGraph, type MemoryGraph } from '@/lib/memory-core';
import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { BrainDump } from '@/components/BrainDump';
import { BrainGraphView } from '@/components/BrainGraphView';
import { BrainChat } from '@/components/BrainChat';

export const dynamic = 'force-dynamic';

/**
 * G-Brain is a single, uncluttered view: just the knowledge graph, sized to
 * fill the screen with no scroll. The engine's health readouts (pillar health,
 * doctor, storage layers, pipeline, query path) live on /doctor so this tab
 * stays one uninterrupted canvas.
 */

// Client nodes are shown only when a live CRM source is available. Seeded
// funnel rows must never appear as current clients in the knowledge graph.
function clientRoster(db: ReturnType<typeof getDb>): RosterClient[] {
  void db;
  return [];
}

// The memory constellation distills a markdown knowledge store (parse + local
// PCA over the notes) — too heavy to redo per request on a force-dynamic page,
// so cache per server process with a short TTL. Never throws.
let memoryCache: { at: number; value: MemoryGraph } | null = null;
const MEMORY_TTL_MS = 5 * 60_000;

function memoryConstellation(): MemoryGraph {
  if (memoryCache && Date.now() - memoryCache.at < MEMORY_TTL_MS) return memoryCache.value;
  let value: MemoryGraph;
  try {
    // A real store on disk is authoritative. An empty store stays empty so
    // the UI never presents a generated constellation as learned knowledge.
    const distilled = distillMemoryGraph(buildBrainGraph(readStoreNotes()));
    value = distilled;
  } catch {
    value = { nodes: [], edges: [] };
  }
  memoryCache = { at: Date.now(), value };
  return value;
}

export default function BrainPage() {
  const db = getDb();
  // latest run per agent (oldest first so the LAST write per id is the newest)
  const runsByAgent = Object.fromEntries(
    db.agentRuns
      .recent(300)
      .reverse()
      .map((r) => [r.agentId, r]),
  );

  const knowledgeGraph = buildKnowledgeGraph(
    db.agents.all(),
    db.departments.all(),
    db.people.all(),
    db.sopTasks.all(),
  );
  const agentCount = db.agents.all().length;
  const trainedCount = db.skills.all().filter((skill) => skill.status === 'live').length;
  const recentRunCount = db.agentRuns.recent(100).length;

  return (
    <div className="flex h-[calc(100dvh-9.25rem)] min-h-[520px] flex-col">
      {/* capture rides the header's right slot: one untitled slot — type, talk,
          or drop documents. The graph owns everything under the title. */}
      <PageHeader
        eyebrow="knowledge core"
        title="G-Brain"
        caret
        rightWide
        right={<div className="flex items-center gap-3"><span className="font-mono text-[11px] text-os-dim">{agentCount} agents · {trainedCount} live skills · {recentRunCount} recent runs</span><BrainDump compact /></div>}
      />

      {/* pull the graph up under the header (offsets PageHeader's shared mb-6)
          so the capture slot sits close to the graph and the canvas gets the
          rest of the viewport */}
      <div className="-mt-3 min-h-0 flex-1">
        <div className="mb-4"><BrainChat /></div>
        <BrainGraphView
          fill
          graph={knowledgeGraph}
          agents={db.agents.all()}
          departments={db.departments.all()}
          people={db.people.all()}
          tasks={db.sopTasks.all()}
          memory={memoryConstellation()}
          clients={clientRoster(db)}
          runsByAgent={runsByAgent}
        />
      </div>
    </div>
  );
}
