import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { TaskBoard } from '@/components/TaskBoard';

export const dynamic = 'force-dynamic';

export default function TasksPage() {
  const db = getDb();
  // The original database shipped with demo cards. Never present those as live work.
  const tasks = db.agentTasks.all().filter((task) => !task.id.startsWith('task-seed-'));
  const agentNames = Object.fromEntries(db.agents.all().map((a) => [a.id, a.name]));
  return (
    <div>
      <PageHeader eyebrow="agent work" title="Tasks" />
      <section className="mb-6 rounded-lg-t border border-os-border bg-os-surface p-5">
        <h2 className="text-[17px] font-semibold">What this board is for</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-os-muted">This is the shared queue for verified work created by you or by an agent. Move approved work from To do to In progress and Done; agents can also update their own tasks when a real run starts or finishes. Only tasks recorded in the local database appear here—no sample campaigns or invented activity.</p>
        <p className="mt-2 font-mono text-[11px] text-os-dim">{tasks.length ? `${tasks.length} verified task${tasks.length === 1 ? '' : 's'} loaded` : 'No verified tasks yet — ask G-Brain to create a plan or add a task from an agent workspace.'}</p>
      </section>
      <TaskBoard initialTasks={tasks} agentNames={agentNames} />
    </div>
  );
}
