import { caldavAccounts, upcomingEvents } from '@/lib/connectors/gcal';
import type { CalEvent } from '@/lib/connectors/gcal';
import { PageHeader } from '@/components/PageHeader';
import { WeekCalendar } from '@/components/WeekCalendar';
import { SectionHead, Badge } from '@/components/terminal';
import { CalendarPlanner } from '@/components/CalendarPlanner';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const accounts = caldavAccounts();
  const nowISO = new Date().toISOString();

  // If no accounts configured, show helpful prompt
  if (accounts.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="schedule" title="Calendar" />
        <CalendarPlanner />
        <div className="rounded-lg-t border border-os-border bg-os-surface p-8">
          <div className="max-w-2xl">
            <h2 className="mb-2 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-os-dim">
              No calendars configured
            </h2>
            <p className="mb-4 text-[14px] leading-relaxed text-os-muted">
              Calendar events appear here after a Google Calendar-capable account is configured and its CalDAV read succeeds.
              Gmail credentials alone do not prove Calendar access.
            </p>
            <p className="text-[13px] text-os-dim">
              Go to <span className="font-mono">Connections</span> and configure a Google account with Calendar access
              to see verified events here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Load events from all configured accounts
  const allEvents = await upcomingEvents(process.env, { days: 14, limit: 100 }).catch(() => []);

  // Sort by start time
  const sorted = allEvents.sort((a: CalEvent, b: CalEvent) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Summary stats
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = sorted.filter((e: CalEvent) => e.start.startsWith(today));
  const upcomingCount = sorted.filter((e: CalEvent) => new Date(e.start) >= new Date()).length;

  return (
    <div>
      <PageHeader
        eyebrow="schedule"
        title="Calendar"
        right={
          <div className="flex gap-2">
            <Badge tone="default">{upcomingCount} upcoming</Badge>
            {todayEvents.length > 0 && <Badge tone="accent">{todayEvents.length} today</Badge>}
          </div>
        }
      />

      <CalendarPlanner />

      {/* Stats row */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg-t border border-os-border bg-os-surface px-5 py-4">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-os-dim">Calendar accounts configured</div>
          <div className="mt-2 font-mono text-[24px] font-semibold">{accounts.length}</div>
        </div>
        <div className="rounded-lg-t border border-os-border bg-os-surface px-5 py-4">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-os-dim">Events this week</div>
          <div className="mt-2 font-mono text-[24px] font-semibold">{sorted.length}</div>
        </div>
        <div className="rounded-lg-t border border-os-border bg-os-surface px-5 py-4">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-os-dim">Today&apos;s schedule</div>
          <div className="mt-2 font-mono text-[24px] font-semibold">{todayEvents.length}</div>
        </div>
      </section>

      {/* Calendar view */}
      {sorted.length > 0 && (
        <section className="mb-6">
          <SectionHead label="Week view" />
          <WeekCalendar events={sorted} accounts={accounts} nowISO={nowISO} />
        </section>
      )}

      {sorted.length === 0 && (
        <section className="rounded-lg-t border border-os-border bg-os-surface p-8">
          <div className="text-center">
            <p className="font-mono text-sm text-os-dim">No events in the next 14 days</p>
          </div>
        </section>
      )}

      {/* Today's events list (if any) */}
      {todayEvents.length > 0 && (
        <section>
          <SectionHead label={`Today's events`} count={todayEvents.length} />
          <div className="space-y-2">
            {todayEvents.map((event: CalEvent) => {
              const start = new Date(event.start);
              const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-sm-t border border-os-border bg-os-surface px-4 py-3 hover:bg-os-surface2"
                >
                  <div className="h-3 w-3 shrink-0 rounded-[2px] mt-1" style={{ background: event.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-os-text">{event.title}</div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[12px] text-os-muted">
                      <span>{time}</span>
                      {event.location && <span>·</span>}
                      {event.location && <span>{event.location}</span>}
                      <span>·</span>
                      <span className="font-mono text-[10px] opacity-75">{event.account}</span>
                    </div>
                  </div>
                  {event.joinUrl && (
                    <a
                      href={event.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-sm-t border border-os-border bg-os-surface2 px-2.5 py-1.5 font-mono text-[11px] text-os-accent hover:bg-os-accent hover:text-os-ink"
                    >
                      Join
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
