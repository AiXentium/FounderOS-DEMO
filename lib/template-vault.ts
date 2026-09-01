export type VaultTemplate = { id: string; name: string; kind: 'frontend' | 'backend' | 'full-stack'; description: string; styles: string[]; components: string[]; animation: string; source: string };

export const TEMPLATE_VAULT: VaultTemplate[] = [
  { id: 'editorial-studio', name: 'Editorial Studio', kind: 'full-stack', description: 'Premium founder or agency site with strong typography and calm conversion flow.', styles: ['Editorial', 'Minimal', 'High contrast'], components: ['Hero', 'Proof rail', 'Services grid', 'CTA'], animation: 'subtle scroll reveals', source: 'Founder OS + DESIGN.md' },
  { id: 'creator-launch', name: 'Creator Launch', kind: 'frontend', description: 'Media-rich creator, course, or personal brand launch system.', styles: ['Bold', 'Playful', 'Mobile-first'], components: ['Hero', 'Offer cards', 'Testimonials', 'FAQ'], animation: 'hover lift and staggered entrances', source: 'UI/UX Pro Max concepts' },
  { id: 'saas-command', name: 'SaaS Command', kind: 'full-stack', description: 'Product-led SaaS marketing shell with dashboard-ready information architecture.', styles: ['Structured', 'Technical', 'Conversion-led'], components: ['Navbar', 'Feature grid', 'Pricing', 'Signup CTA'], animation: 'controlled page transitions', source: 'Founder OS + component recipes' },
  { id: 'affiliate-magazine', name: 'Affiliate Magazine', kind: 'full-stack', description: 'SEO-friendly editorial catalog for products, experiences, and campaign links.', styles: ['Magazine', 'Trust-first', 'Content-rich'], components: ['Category nav', 'Product cards', 'Comparison table', 'Disclosure'], animation: 'image reveal and card hover', source: 'Affiliate Studio' },
  { id: 'agency-ops', name: 'Agency Operations', kind: 'backend', description: 'Client workspace foundation for projects, agents, tasks, approvals, and reporting.', styles: ['Operational', 'Dense', 'Accessible'], components: ['Workspace switcher', 'Agent roster', 'Task board', 'Reports'], animation: 'functional state transitions', source: 'Founder OS systems layer' },
];

export function templateById(id: string) { return TEMPLATE_VAULT.find((template) => template.id === id) ?? TEMPLATE_VAULT[0]; }
