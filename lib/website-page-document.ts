import { randomUUID } from 'node:crypto';
import { WebsitePageDocumentSchema, type WebsiteActor, type WebsiteLifecycle, type WebsitePageDocument } from '@/lib/website-revision-schema';
import { PageAffiliateOfferSchema } from '@/lib/website-affiliates';
import { TEMPLATE_VAULT } from '@/lib/template-vault';
import { hash } from '@/lib/website-revisions';

export const SECTION_VARIANTS = ['standard', 'centered', 'split', 'grid', 'timeline', 'compact', 'feature'] as const;
export const SECTION_TYPES = ['hero', 'rich-text', 'image', 'gallery', 'highlights', 'cards', 'itinerary', 'affiliate', 'faq', 'cta', 'footer'] as const;
const escape = (value = '') => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const safeHref = (value = '#') => /^(?:https?:\/\/|\/|#|mailto:)/i.test(value) ? value : '#';

export function initialDocument(html: string, pagePath: string): WebsitePageDocument {
  const text = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || pagePath.split('/').pop()?.replace(/\.html$/, '').replace(/[-_]/g, ' ') || 'Untitled page').trim();
  const description = html.match(/<meta[^>]+name=['"]description['"][^>]+content=['"]([^'"]*)/i)?.[1] || '';
  return WebsitePageDocumentSchema.parse({ schemaVersion: 1, pagePath, title: text, templateId: 'affiliate-magazine', pageType: 'article', seo: { title: text, description, noIndex: false }, sections: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

const MANAGED_STYLE = '<!-- business-os:styles:start --><style>.os-managed{--navy:#0f172a;--gold:#d97706;--paper:#fff;--wash:#f8fafc;--ink:#1e293b;color:var(--ink);background:var(--paper);font:17px/1.7 system-ui,sans-serif}.os-managed .section{padding:clamp(3rem,7vw,7rem) 5%}.os-managed .section:nth-child(even){background:var(--wash)}.os-managed .inner{max-width:1120px;margin:auto}.os-managed .eyebrow{text-transform:uppercase;letter-spacing:.15em;color:var(--gold);font-weight:700}.os-managed h1,.os-managed h2,.os-managed h3{font-family:Georgia,serif;line-height:1.15;color:var(--navy)}.os-managed h2{font-size:clamp(2rem,5vw,4rem)}.os-managed .type-hero{min-height:60vh;display:grid;align-items:center;background:var(--navy);color:white}.os-managed .type-hero h2{color:white}.os-managed .items{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1.25rem}.os-managed .items article{padding:1.25rem;background:white;border:1px solid #e2e8f0;border-radius:14px}.os-managed .variant-centered{text-align:center}.os-managed .variant-split .inner{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:center}.os-managed .variant-compact{padding-block:2rem}.os-managed .cta{display:inline-block;background:var(--gold);color:white;padding:.75rem 1.1rem;border-radius:8px;text-decoration:none;font-weight:700}.os-managed img{max-width:100%;height:auto;border-radius:14px}.os-managed .disclosure{font-size:.9rem}@media(max-width:700px){.os-managed .variant-split .inner{grid-template-columns:1fr}.os-managed .section{padding-inline:1.25rem}}</style><!-- business-os:styles:end -->';
const stripManaged = (html: string) => html
  .replace(/<!-- business-os:styles:start -->[\s\S]*?<!-- business-os:styles:end -->/g, '')
  .replace(/<!-- business-os:sections:start -->[\s\S]*?<!-- business-os:sections:end -->/g, '');
const setMeta = (html: string, document: WebsitePageDocument) => {
  let next = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escape(document.seo.title)}</title>`);
  if (!/<title[^>]*>/i.test(next)) next = next.replace(/<head([^>]*)>/i, `<head$1><title>${escape(document.seo.title)}</title>`);
  const description = `<meta name="description" content="${escape(document.seo.description)}">`;
  next = /<meta[^>]+name=["']description["'][^>]*>/i.test(next) ? next.replace(/<meta[^>]+name=["']description["'][^>]*>/i, description) : next.replace(/<\/head>/i, `${description}</head>`);
  next = next.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '').replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '');
  const controls = `${document.seo.canonical ? `<link rel="canonical" href="${escape(document.seo.canonical)}">` : ''}${document.seo.noIndex ? '<meta name="robots" content="noindex,nofollow">' : ''}`;
  return next.replace(/<\/head>/i, `${controls}</head>`);
};

export function renderDocument(document: WebsitePageDocument, offers: unknown[] = [], baseHtml?: string) {
  const template = TEMPLATE_VAULT.find(item => item.id === document.templateId);
  if (!template) throw new Error('Only an approved template from the Template Vault may be used.');
  const verifiedOffers = offers.map(item => PageAffiliateOfferSchema.parse(item));
  const sections = document.sections.filter(s => s.visible).map(section => {
    const image = section.image ? `<figure><img src="${escape(section.image.src)}" alt="${escape(section.image.alt)}" loading="lazy"></figure>` : '';
    const items = section.items.length ? `<div class="items">${section.items.map(item => `<article>${item.image ? `<img src="${escape(item.image.src)}" alt="${escape(item.image.alt)}" loading="lazy">` : ''}<h3>${escape(item.title)}</h3>${item.text ? `<p>${escape(item.text)}</p>` : ''}${item.href ? `<a href="${escape(safeHref(item.href))}">Learn more</a>` : ''}</article>`).join('')}</div>` : '';
    const cta = section.cta ? `<a class="cta" href="${escape(safeHref(section.cta.href))}">${escape(section.cta.label)}</a>` : '';
    const affiliate = section.type === 'affiliate' ? `<p class="disclosure">This page contains affiliate links. If you book or buy through them, we may earn a commission at no extra cost to you.</p><div class="items">${verifiedOffers.filter(o => section.offerIds.includes(o.id)).map(o => `<article><h3>${escape(o.title)}</h3><p>${escape(o.matchReason)}</p><a class="cta" rel="sponsored nofollow noopener" target="_blank" href="${escape(o.trackedUrl)}">${o.provider === 'viator' ? 'Check availability on Viator' : 'View on Amazon'}</a></article>`).join('')}</div>` : '';
    return `<section id="${escape(section.id)}" class="section type-${section.type} variant-${section.variant}"><div class="inner">${section.eyebrow ? `<p class="eyebrow">${escape(section.eyebrow)}</p>` : ''}${section.heading ? `<h2>${escape(section.heading)}</h2>` : ''}${section.body ? `<p class="body">${escape(section.body)}</p>` : ''}${image}${items}${affiliate}${cta}</div></section>`;
  }).join('');
  if (baseHtml) {
    let html = setMeta(stripManaged(baseHtml), document);
    html = html.replace(/<body([^>]*)>/i, (_match, attrs: string) => `<body${attrs.replace(/\sdata-template=["'][^"']*["']/i, '')} data-template="${escape(template.id)}">`);
    html = html.replace(/<\/head>/i, `${MANAGED_STYLE}</head>`);
    if (sections) html = html.replace(/<\/body>/i, `<!-- business-os:sections:start --><div class="os-managed">${sections}</div><!-- business-os:sections:end --></body>`);
    return html;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(document.seo.title)}</title><meta name="description" content="${escape(document.seo.description)}">${document.seo.canonical ? `<link rel="canonical" href="${escape(document.seo.canonical)}">` : ''}${document.seo.noIndex ? '<meta name="robots" content="noindex,nofollow">' : ''}${MANAGED_STYLE}</head><body data-template="${escape(template.id)}"><div class="os-managed">${sections || '<main class="section"><div class="inner"><h1>Structured page</h1><p>Add approved sections in Business OS.</p></div></main>'}</div></body></html>`;
}

export type ManageCommand = { action: string; actor: WebsiteActor; pagePath?: string; revisionId?: string; templateId?: string; section?: unknown; sectionId?: string; index?: number; patch?: Record<string, unknown>; seo?: unknown; offer?: unknown; scheduledFor?: string; title?: string; match?: string; replacement?: string; sourceUrl?: string; replacementUrl?: string; alt?: string; href?: string };

export function applyManagedCommand(state: WebsiteLifecycle, command: ManageCommand): WebsiteLifecycle {
  const parent = state.revisions.find(item => item.id === (command.revisionId || state.selectedId));
  if (!parent) throw new Error('Select a page revision first.');
  const now = new Date().toISOString();
  let document = parent.document || initialDocument(parent.html, parent.pagePath || state.pagePath);
  let baseHtml = parent.html;
  let offers = [...parent.affiliateOffers];
  const sections = [...document.sections];
  if (command.action === 'changeTemplate') {
    if (!TEMPLATE_VAULT.some(t => t.id === command.templateId)) throw new Error('Template is not approved.');
    document = { ...document, templateId: command.templateId! };
  } else if (command.action === 'addSection') {
    const section = WebsitePageDocumentSchema.shape.sections.element.parse(command.section);
    sections.splice(command.index ?? sections.length, 0, section); document = { ...document, sections };
  } else if (command.action === 'removeSection') {
    document = { ...document, sections: sections.filter(s => s.id !== command.sectionId) };
  } else if (command.action === 'reorderSection') {
    const from = sections.findIndex(s => s.id === command.sectionId); if (from < 0) throw new Error('Section not found.');
    const [moved] = sections.splice(from, 1); sections.splice(Math.max(0, Math.min(command.index ?? 0, sections.length)), 0, moved); document = { ...document, sections };
  } else if (command.action === 'editSection') {
    const allowed = ['variant', 'eyebrow', 'heading', 'body', 'image', 'cta', 'items', 'offerIds', 'visible'];
    if (Object.keys(command.patch || {}).some(k => !allowed.includes(k))) throw new Error('Only structured section fields may be edited. CSS and HTML are not accepted.');
    document = { ...document, sections: sections.map(s => s.id === command.sectionId ? WebsitePageDocumentSchema.shape.sections.element.parse({ ...s, ...command.patch }) : s) };
  } else if (command.action === 'updateSeo') {
    document = { ...document, seo: WebsitePageDocumentSchema.shape.seo.parse({ ...document.seo, ...(command.seo as object) }) };
  } else if (command.action === 'addAffiliate') {
    const offer = PageAffiliateOfferSchema.parse(command.offer); offers = [...offers.filter(o => o.id !== offer.id), offer];
    const affiliateIndex = sections.findIndex(s => s.type === 'affiliate');
    if (affiliateIndex >= 0) sections[affiliateIndex] = { ...sections[affiliateIndex], offerIds: [...new Set([...sections[affiliateIndex].offerIds, offer.id])] };
    else sections.push({ id: `affiliate-${randomUUID()}`, type: 'affiliate', variant: 'grid', heading: 'Useful booking options', items: [], offerIds: [offer.id], visible: true });
    document = { ...document, sections };
  } else if (command.action === 'editSourceText') {
    if (!command.match || command.replacement === undefined || /[<>]/.test(command.match + command.replacement)) throw new Error('Choose exact visible text; HTML is not accepted.');
    if (baseHtml.split(command.match).length !== 2) throw new Error('The source text must occur exactly once in this revision.');
    baseHtml = baseHtml.replace(command.match, escape(command.replacement));
  } else if (command.action === 'swapSourceImage') {
    if (!command.sourceUrl || !command.replacementUrl || /^(?:javascript|data):/i.test(command.replacementUrl) || /[\\\s"'<>]/.test(command.replacementUrl)) throw new Error('Choose an existing image and a safe replacement URL.');
    const needle = new RegExp(`(<img\\b[^>]*\\bsrc=["'])${command.sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'][^>]*>)`, 'gi');
    const matches = [...baseHtml.matchAll(needle)]; if (matches.length !== 1) throw new Error('The source image must occur exactly once in this revision.');
    baseHtml = baseHtml.replace(needle, (_all, before, after) => `${before}${escape(command.replacementUrl)}${after.replace(/\balt=["'][^"']*["']/i, command.alt !== undefined ? `alt="${escape(command.alt)}"` : '$&')}`);
  } else if (command.action === 'editSourceCta') {
    if (!command.match || command.replacement === undefined || /[<>]/.test(command.match + command.replacement) || (command.href && safeHref(command.href) === '#')) throw new Error('Choose exact CTA text and a safe destination. HTML is not accepted.');
    const label = command.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const anchor = new RegExp(`(<a\\b[^>]*)(>\\s*)${label}(\\s*<\\/a>)`, 'gi');
    const matches = [...baseHtml.matchAll(anchor)]; if (matches.length !== 1) throw new Error('The CTA label must occur exactly once in this revision.');
    baseHtml = baseHtml.replace(anchor, (_all, open: string, close: string, end: string) => `${command.href ? (/\bhref=["'][^"']*["']/i.test(open) ? open.replace(/\bhref=["'][^"']*["']/i, `href="${escape(command.href)}"`) : `${open} href="${escape(command.href)}"`) : open}${close}${escape(command.replacement)}${end}`);
  } else throw new Error('Unsupported structured page action.');
  document = WebsitePageDocumentSchema.parse({ ...document, updatedAt: now });
  const html = renderDocument(document, offers, baseHtml);
  const revision = { ...parent, id: randomUUID(), html, hash: hash(html), kind: 'manual' as const, createdAt: now, parentId: parent.id, approvedHash: undefined, approvedAt: undefined, stagedHash: undefined, status: 'draft' as const, document, attribution: command.actor, affiliateOffers: offers, warnings: [], qa: { status: 'not_run' as const, summary: 'QA must run before approval.', checks: [] } };
  return { ...state, selectedId: revision.id, revisions: [...state.revisions, revision] };
}
