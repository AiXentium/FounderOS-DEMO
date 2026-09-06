'use client';

import { Sparkles, Wand2 } from 'lucide-react';

export type WebsiteCommand = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const WEBSITE_COMMANDS: WebsiteCommand[] = [
  { id: 'full-site', label: 'Build the complete site', description: 'Create every key page from the selected template.', prompt: 'Create the complete website, including the page tree, shared navigation, footer, key conversion pages, and responsive layouts. Use the selected template as the structural starting point.' },
  { id: 'redesign', label: 'Redesign this website', description: 'Preserve the brand while improving clarity and conversion.', prompt: 'Redesign the complete website without losing the existing brand colors, logo, typography direction, voice, content hierarchy, or important page relationships. Make the layout cleaner, more readable, accessible, and conversion-ready.' },
  { id: 'travel-hub', label: 'Build a travel content hub', description: 'Organize guides, itineraries, and affiliate paths.', prompt: 'Build a professional travel website with destination guides, points and miles education, itineraries, real-image requirements, transparent affiliate disclosures, an email opt-in, and clear paths from discovery to useful trip planning.' },
  { id: 'conversion', label: 'Improve the conversion path', description: 'Make the next action obvious on every important page.', prompt: 'Review the entire site conversion path. Strengthen the promise, proof, calls to action, internal links, email opt-in, mobile hierarchy, and trust signals without inventing business facts.' },
  { id: 'quality', label: 'Run a quality and accessibility pass', description: 'Find weak content, layout, mobile, and accessibility points.', prompt: 'Audit the complete website for readability, accessibility, mobile behavior, performance, unclear copy, missing states, weak navigation, image alt text, disclosure placement, and unsupported claims. Return specific fixes and apply only approved changes.' },
];

export function WebsiteCommandLibrary({ onSelect }: { onSelect: (command: WebsiteCommand) => void }) {
  return <section className="border border-os-border bg-os-surface p-4">
    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-os-accent" /><div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-os-accent">Start with a command</div><div className="mt-1 text-[13px] font-semibold">Use a proven direction</div></div></div>
    <div className="mt-3 grid gap-2">
      {WEBSITE_COMMANDS.slice(0, 3).map((command) => <button key={command.id} type="button" onClick={() => onSelect(command)} className="flex items-start gap-2 border border-os-border bg-os-surface2 p-3 text-left hover:border-[var(--accent-line)]"><Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-os-accent" /><span><span className="block text-[12px] font-semibold">{command.label}</span><span className="mt-1 block text-[11px] leading-4 text-os-muted">{command.description}</span></span></button>)}
    </div>
    <label className="mt-3 block text-[11px] text-os-muted">Prompt library<select aria-label="Website prompt library" defaultValue="" onChange={(event) => { const command = WEBSITE_COMMANDS.find((item) => item.id === event.target.value); if (command) onSelect(command); }} className="mt-1 w-full border border-os-border bg-os-surface2 px-3 py-2 text-[12px] text-os-copy outline-none focus:border-[var(--accent-line)]"><option value="">Choose a command…</option>{WEBSITE_COMMANDS.map((command) => <option key={command.id} value={command.id}>{command.label}</option>)}</select></label>
  </section>;
}
