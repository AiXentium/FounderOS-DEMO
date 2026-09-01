export const STYLE_DIRECTIONS = [
  { id: 'editorial', name: 'Editorial signal', font: 'Display serif + mono', palette: 'Paper / ink / moss', rule: 'Use asymmetry, generous whitespace, and one sharp CTA.' },
  { id: 'brutalist', name: 'Confident utility', font: 'Heavy grotesk + mono', palette: 'Ink / acid / bone', rule: 'Use oversized type, hard edges, and blunt copy.' },
  { id: 'quiet-luxury', name: 'Quiet luxury', font: 'Elegant serif + sans', palette: 'Warm white / charcoal / bronze', rule: 'Use restrained motion, fine borders, and fewer elements.' },
  { id: 'neural', name: 'Technical depth', font: 'Grotesk + mono', palette: 'Midnight / cyan / violet', rule: 'Use diagrams, grids, and progressive disclosure.' },
] as const;

export function tasteAudit(copy: { title: string; sections: number; cta: string; direction: string }) {
  const checks = [
    { label: 'Distinct direction', pass: copy.direction !== 'generic' },
    { label: 'Clear promise', pass: copy.title.length >= 24 && copy.title.length <= 90 },
    { label: 'Conversion path', pass: Boolean(copy.cta) },
    { label: 'Content depth', pass: copy.sections >= 4 },
    { label: 'Anti-generic rule', pass: copy.direction !== 'generic' },
  ];
  return { score: Math.round((checks.filter((c) => c.pass).length / checks.length) * 100), checks };
}
