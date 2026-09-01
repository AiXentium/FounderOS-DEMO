'use client';

import { useEffect } from 'react';

export type SectionDesign = { subtitle: string; cta: string; accent: string };

export function SectionInspector({ value, onChange }: { value: SectionDesign; onChange: (value: SectionDesign) => void }) {
  const applyPreview = (next: SectionDesign) => {
    const canvas = document.querySelector('[class*="min-h-[650px]"]');
    if (!canvas) return;
    const copy = canvas.querySelector('p');
    const cta = canvas.querySelector('button');
    if (copy) copy.textContent = next.subtitle;
    if (cta) { cta.textContent = `${next.cta} ↗`; cta.style.backgroundColor = next.accent; }
    canvas.setAttribute('data-accent', next.accent);
    canvas.querySelectorAll<HTMLElement>('[data-builder-accent]').forEach((element) => { element.style.color = next.accent; });
  };
  useEffect(() => { applyPreview(value); }, [value]);
  const update = (key: keyof SectionDesign, next: string) => { const updated = { ...value, [key]: next }; onChange(updated); applyPreview(updated); };
  return <section className="rounded-lg-t border border-os-border bg-os-surface p-3">
    <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-os-dim">Visual content inspector</div>
    <label className="mb-3 block text-[10px] uppercase text-os-dim">Supporting copy<textarea value={value.subtitle} onChange={(event) => update('subtitle', event.target.value)} className="mt-1 h-20 w-full resize-y rounded-sm-t border border-os-border bg-os-surface2 p-2 text-[11px] normal-case text-os-text outline-none focus:border-os-accent" /></label>
    <label className="mb-3 block text-[10px] uppercase text-os-dim">Call to action<input value={value.cta} onChange={(event) => update('cta', event.target.value)} className="mt-1 w-full rounded-sm-t border border-os-border bg-os-surface2 p-2 text-[11px] normal-case text-os-text outline-none focus:border-os-accent" /></label>
    <label className="flex items-center justify-between text-[10px] uppercase text-os-dim">Accent color<input aria-label="Accent color" type="color" value={value.accent} onChange={(event) => update('accent', event.target.value)} className="h-7 w-10 cursor-pointer border-0 bg-transparent" /></label>
  </section>;
}
