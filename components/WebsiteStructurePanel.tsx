'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { SectionHead } from '@/components/terminal';

export const WEBSITE_BLOCK_LIBRARY = ['Hero', 'Social proof', 'Feature grid', 'Offer / CTA', 'FAQ', 'Footer', 'Testimonials', 'Pricing', 'Contact'];

export const WEBSITE_BLOCK_COPY: Record<string, string> = {
  'Social proof': 'Add evidence that makes the promise credible: client results, testimonials, or trusted-by signals.',
  'Feature grid': 'Explain the offer in a scannable set of benefits, services, or differentiators.',
  'Offer / CTA': 'Turn interest into the next clear action with one focused offer and call to action.',
  FAQ: 'Answer the questions that could stop a visitor from taking the next step.',
  Footer: 'Close with navigation, trust details, and the links visitors need after the main decision.',
  Testimonials: 'Show specific customer stories that reinforce the page promise.',
  Pricing: 'Make packages or pricing easy to compare without hiding the important terms.',
  Contact: 'Give visitors a direct, low-friction way to start a conversation.',
};

export function WebsiteStructurePanel({ blocks, onChange, compact = false }: { blocks: string[]; onChange: (blocks: string[]) => void; compact?: boolean }) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index: number) => onChange(blocks.filter((_, itemIndex) => itemIndex !== index));
  const add = (block: string) => { if (!blocks.includes(block)) onChange([...blocks, block]); };

  return <section className={compact ? 'border border-os-border bg-os-surface p-3' : 'border border-os-border bg-os-surface p-4'}>
    <div className="flex items-center justify-between"><SectionHead label="Page structure" count={`${blocks.length} active`} /><span className="font-mono text-[10px] text-os-dim">Drag to reorder</span></div>
    <div className="mt-3 flex flex-wrap gap-2">{WEBSITE_BLOCK_LIBRARY.map((block) => <button key={block} type="button" onClick={() => add(block)} disabled={blocks.includes(block)} className="flex items-center gap-1 border border-os-border bg-os-surface2 px-2 py-1.5 text-[10px] text-os-muted hover:border-[var(--accent-line)] disabled:cursor-not-allowed disabled:opacity-35"><Plus className="h-3 w-3 text-os-accent" />{block}</button>)}</div>
    <div className="mt-3 space-y-1.5 border-t border-os-border pt-3">{blocks.map((block, index) => <div key={`${block}-${index}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const from = Number(event.dataTransfer.getData('text/plain')); if (!Number.isInteger(from) || from === index) return; const next = [...blocks]; const [item] = next.splice(from, 1); next.splice(index, 0, item); onChange(next); }} className="flex items-center gap-2 border border-os-border bg-os-surface2 px-2.5 py-2"><span className="flex-1 cursor-grab text-[12px]" title={WEBSITE_BLOCK_COPY[block]}>⠿ {block}</span><button type="button" aria-label={`Move ${block} up`} onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-os-dim hover:text-os-accent disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button><button type="button" aria-label={`Move ${block} down`} onClick={() => move(index, 1)} disabled={index === blocks.length - 1} className="p-1 text-os-dim hover:text-os-accent disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button><button type="button" aria-label={`Remove ${block}`} onClick={() => remove(index)} className="p-1 text-os-dim hover:text-os-warn"><Trash2 className="h-3 w-3" /></button></div>)}</div>
  </section>;
}
