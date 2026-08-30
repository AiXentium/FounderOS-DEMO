'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-screen place-items-center bg-os-bg px-6 text-os-text">
      <section className="w-full max-w-lg rounded-lg-t border border-os-border bg-os-surface p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-os-accent">Business OS · recovery</div>
        <h1 className="mt-3 text-2xl font-semibold">This workspace hit a temporary error.</h1>
        <p className="mt-2 text-sm leading-relaxed text-os-muted">Your local data is safe. Try the page again, or return to the dashboard.</p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => reset()} className="rounded-sm-t bg-os-accent px-4 py-2 font-mono text-[10px] font-bold uppercase text-[var(--accent-ink)]">Try again</button>
          <Link href="/" className="rounded-sm-t border border-os-border px-4 py-2 font-mono text-[10px] uppercase text-os-muted">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
