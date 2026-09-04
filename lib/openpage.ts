export const OPENPAGE_WORKSPACE = 'openpage';
export const OPENPAGE_MEMORY_FOLDER = 'openpage';
export const OPENPAGE_SCHEMA_VERSION = 'openpage-v1';

export type OpenPageBlockType =
  | 'navbar' | 'hero' | 'features' | 'content' | 'image' | 'stats'
  | 'testimonials' | 'faq' | 'cta' | 'newsletter' | 'footer';

export type OpenPageTheme = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  displayFont: string;
  bodyFont: string;
  radius: number;
};

export type OpenPageBlock = {
  id: string;
  type: OpenPageBlockType;
  label: string;
  props: Record<string, unknown>;
};

export type OpenPageDocument = {
  schemaVersion: typeof OPENPAGE_SCHEMA_VERSION;
  name: string;
  description: string;
  theme: OpenPageTheme;
  blocks: OpenPageBlock[];
  metadata: { purpose: string; audience: string; source: string };
  updatedAt: string;
};

const THEME: OpenPageTheme = {
  background: '#f7f1e8',
  surface: '#fffaf3',
  text: '#201a18',
  muted: '#756a62',
  accent: '#d94f35',
  displayFont: 'Fraunces, Georgia, serif',
  bodyFont: 'DM Sans, Arial, sans-serif',
  radius: 18,
};

const newId = () => globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const block = (type: OpenPageBlockType, label: string, props: Record<string, unknown>): OpenPageBlock => ({ id: newId(), type, label, props });

export function defaultOpenPageDocument(name = 'Barcelona Affiliate Studio'): OpenPageDocument {
  return {
    schemaVersion: OPENPAGE_SCHEMA_VERSION,
    name,
    description: 'An editorial travel landing page with a structured JSON source of truth.',
    theme: { ...THEME },
    metadata: {
      purpose: 'Build a useful, conversion-ready Barcelona travel guide.',
      audience: 'Points-and-miles travelers planning a first or repeat Barcelona trip.',
      source: 'OpenPage starter · Business OS',
    },
    updatedAt: new Date().toISOString(),
    blocks: [
      block('navbar', 'Navigation', { brand: "LET'S TALK MILES & TRAVEL", links: ['Barcelona', 'Itineraries', 'Experiences', 'Plan your trip'] }),
      block('hero', 'Hero', { eyebrow: 'BARCELONA · CURATED FOR SMARTER TRAVEL', headline: 'Barcelona, with a better plan.', subheadline: 'A human guide to Gaudí, neighborhood tables, coastal escapes, and the experiences worth building a trip around.', cta: 'Explore Barcelona', secondaryCta: 'See the itinerary' }),
      block('features', 'Trip angles', { heading: 'Start with the kind of day you want.', items: ['Gaudí without the guesswork', 'Tapas routes locals actually enjoy', 'Coastline escapes from the city'] }),
      block('content', 'Editorial note', { eyebrow: 'THE OPENPAGE APPROACH', heading: 'A page that can keep learning.', body: 'This draft is a structured page, not a screenshot. G-Brain can remember the brief, agents can inspect each block, and the same document can be exported for review before anything is published.' }),
      block('stats', 'Proof points', { items: [{ value: '3', label: 'neighborhood rhythms' }, { value: '5', label: 'day-trip directions' }, { value: '1', label: 'clear starting point' }] }),
      block('cta', 'Call to action', { heading: 'Build your Barcelona days around what matters.', body: 'Save the draft, ask the agents to refine it, then approve the version you want to publish.', cta: 'Start planning' }),
      block('footer', 'Footer', { text: "LET'S TALK MILES & TRAVEL · OPENPAGE DRAFT" }),
    ],
  };
}

function stringValue(value: unknown, fallback: string): string { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function safeColor(value: unknown, fallback: string): string { return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback; }
function safeFont(value: unknown, fallback: string): string { return typeof value === 'string' && /^[a-zA-Z0-9 ,.'"-]+$/.test(value) ? value : fallback; }

export function normalizeOpenPageDocument(value: unknown, fallbackName = 'Untitled OpenPage draft'): OpenPageDocument {
  const input = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const themeInput = (input.theme && typeof input.theme === 'object' ? input.theme : {}) as Record<string, unknown>;
  const rawBlocks = Array.isArray(input.blocks) ? input.blocks : [];
  const allowed = new Set<OpenPageBlockType>(['navbar', 'hero', 'features', 'content', 'image', 'stats', 'testimonials', 'faq', 'cta', 'newsletter', 'footer']);
  const blocks = rawBlocks.slice(0, 40).map((raw, index) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const type = allowed.has(item.type as OpenPageBlockType) ? item.type as OpenPageBlockType : 'content';
    return {
      id: stringValue(item.id, `block-${index + 1}`),
      type,
      label: stringValue(item.label, type[0].toUpperCase() + type.slice(1)),
      props: item.props && typeof item.props === 'object' ? item.props as Record<string, unknown> : {},
    };
  });
  const now = new Date().toISOString();
  return {
    schemaVersion: OPENPAGE_SCHEMA_VERSION,
    name: stringValue(input.name, fallbackName),
    description: stringValue(input.description, 'OpenPage structured website draft.'),
    theme: {
      background: safeColor(themeInput.background, THEME.background),
      surface: safeColor(themeInput.surface, THEME.surface),
      text: safeColor(themeInput.text, THEME.text),
      muted: safeColor(themeInput.muted, THEME.muted),
      accent: safeColor(themeInput.accent, THEME.accent),
      displayFont: safeFont(themeInput.displayFont, THEME.displayFont),
      bodyFont: safeFont(themeInput.bodyFont, THEME.bodyFont),
      radius: typeof themeInput.radius === 'number' ? Math.min(40, Math.max(0, themeInput.radius)) : THEME.radius,
    },
    metadata: {
      purpose: stringValue((input.metadata as Record<string, unknown> | undefined)?.purpose, 'Create a useful, reviewable website draft.'),
      audience: stringValue((input.metadata as Record<string, unknown> | undefined)?.audience, 'The intended audience for this page.'),
      source: stringValue((input.metadata as Record<string, unknown> | undefined)?.source, 'OpenPage · Business OS'),
    },
    updatedAt: stringValue(input.updatedAt, now),
    blocks: blocks.length ? blocks : defaultOpenPageDocument(fallbackName).blocks,
  };
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
const text = (value: unknown, fallback = '') => escapeHtml(stringValue(value, fallback));
const list = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 12) : [];

export function renderOpenPageHtml(input: OpenPageDocument): string {
  const doc = normalizeOpenPageDocument(input);
  const t = doc.theme;
  const renderBlock = (item: OpenPageBlock): string => {
    const p = item.props;
    if (item.type === 'navbar') return `<nav class="op-nav"><strong>${text(p.brand, doc.name)}</strong><div>${list(p.links).map((link) => `<a href="#">${escapeHtml(link)}</a>`).join('')}</div></nav>`;
    if (item.type === 'hero') return `<section class="op-hero"><div class="op-kicker">${text(p.eyebrow, 'OPENPAGE DRAFT')}</div><h1>${text(p.headline, doc.name)}</h1><p>${text(p.subheadline, doc.description)}</p><div class="op-actions"><a class="op-button" href="#">${text(p.cta, 'Explore')}</a><a class="op-link" href="#">${text(p.secondaryCta, 'Read more')} ↗</a></div></section>`;
    if (item.type === 'features') return `<section class="op-section"><div class="op-kicker">OPENPAGE BLOCK · ${escapeHtml(item.label)}</div><h2>${text(p.heading, 'Make the page useful.')}</h2><div class="op-grid">${list(p.items).map((itemText, index) => `<article class="op-card"><span>0${index + 1}</span><h3>${escapeHtml(itemText)}</h3><p>Grounded in the brief, ready for an agent to refine.</p></article>`).join('')}</div></section>`;
    if (item.type === 'content') return `<section class="op-section op-content"><div class="op-kicker">${text(p.eyebrow, 'EDITORIAL NOTE')}</div><h2>${text(p.heading, 'A page with a point of view.')}</h2><p>${text(p.body, doc.description)}</p></section>`;
    if (item.type === 'stats') return `<section class="op-stats">${(Array.isArray(p.items) ? p.items : []).slice(0, 6).map((raw) => { const stat = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>; return `<div><strong>${text(stat.value, '—')}</strong><span>${text(stat.label, 'proof point')}</span></div>`; }).join('')}</section>`;
    if (item.type === 'cta') return `<section class="op-cta"><h2>${text(p.heading, 'Ready for the next draft?')}</h2><p>${text(p.body, 'Review the work before publishing.')}</p><a class="op-button" href="#">${text(p.cta, 'Continue')} ↗</a></section>`;
    if (item.type === 'footer') return `<footer class="op-footer">${text(p.text, doc.name)}</footer>`;
    return `<section class="op-section"><div class="op-kicker">OPENPAGE BLOCK · ${escapeHtml(item.label)}</div><h2>${text(p.heading, item.label)}</h2><p>${text(p.body, 'This block is ready for the next agent pass.')}</p></section>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(doc.name)}</title><style>
  :root{--bg:${t.background};--surface:${t.surface};--text:${t.text};--muted:${t.muted};--accent:${t.accent};--radius:${t.radius}px}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:${t.bodyFont};line-height:1.55}a{color:inherit;text-decoration:none}.op-wrap{max-width:1120px;margin:auto;padding:24px 28px}.op-nav{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:10px 0 34px;text-transform:uppercase;letter-spacing:.12em;font-size:11px}.op-nav strong{font-size:12px}.op-nav div{display:flex;gap:18px;color:var(--muted)}.op-hero{padding:70px 0 82px;max-width:800px}.op-kicker{font-size:11px;letter-spacing:.18em;color:var(--accent);font-weight:700}.op-hero h1{font-family:${t.displayFont};font-weight:500;font-size:clamp(48px,8vw,94px);line-height:.96;letter-spacing:-.06em;margin:18px 0 26px}.op-hero p,.op-content p{font-size:20px;color:var(--muted);max-width:680px}.op-actions{display:flex;align-items:center;gap:22px;margin-top:30px}.op-button{background:var(--accent);color:#fff;padding:13px 18px;border-radius:999px;font-weight:700;font-size:13px}.op-link{font-size:13px;font-weight:700}.op-section{border-top:1px solid color-mix(in srgb,var(--text) 18%,transparent);padding:55px 0}.op-section h2,.op-cta h2{font-family:${t.displayFont};font-size:clamp(32px,5vw,58px);font-weight:500;line-height:1.02;letter-spacing:-.04em;margin:12px 0 28px}.op-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.op-card{background:var(--surface);border-radius:var(--radius);padding:22px;min-height:180px}.op-card span{color:var(--accent);font-size:12px}.op-card h3{font-size:20px;margin:36px 0 8px;line-height:1.1}.op-card p{color:var(--muted);font-size:13px}.op-content{max-width:780px}.op-stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid color-mix(in srgb,var(--text) 18%,transparent);border-bottom:1px solid color-mix(in srgb,var(--text) 18%,transparent);padding:28px 0;margin-bottom:10px}.op-stats div{display:flex;flex-direction:column;gap:5px}.op-stats strong{font-family:${t.displayFont};font-size:48px;font-weight:500}.op-stats span{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.1em}.op-cta{background:var(--text);color:var(--bg);padding:55px 34px;border-radius:var(--radius);margin:35px 0}.op-cta p{color:color-mix(in srgb,var(--bg) 70%,transparent);max-width:500px}.op-footer{padding:35px 0 15px;color:var(--muted);font-size:11px;letter-spacing:.15em}@media(max-width:700px){.op-wrap{padding:18px}.op-nav{align-items:flex-start;flex-direction:column}.op-nav div{flex-wrap:wrap}.op-grid,.op-stats{grid-template-columns:1fr}.op-hero{padding:45px 0}.op-hero p{font-size:17px}}
  </style></head><body><main class="op-wrap">${doc.blocks.map(renderBlock).join('')}</main></body></html>`;
}

export function openPageMemoryText(doc: OpenPageDocument, prompt = ''): string {
  const normalized = normalizeOpenPageDocument(doc);
  return [
    `OpenPage project: ${normalized.name}`,
    `Workspace: ${OPENPAGE_WORKSPACE}`,
    `Purpose: ${normalized.metadata.purpose}`,
    `Audience: ${normalized.metadata.audience}`,
    prompt ? `Brief: ${prompt}` : '',
    `Blocks: ${normalized.blocks.map((item) => `${item.type}:${item.label}`).join(', ')}`,
    `Schema: ${normalized.schemaVersion}`,
    `Source: ${normalized.metadata.source}`,
  ].filter(Boolean).join('\n');
}

export function openPageSlug(name: string, id: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'draft';
  return `${OPENPAGE_MEMORY_FOLDER}/${slug}-${id.slice(0, 8)}`;
}
