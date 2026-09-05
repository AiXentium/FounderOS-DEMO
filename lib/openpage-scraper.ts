import dns from 'node:dns/promises';
import net from 'node:net';

const MAX_HTML_BYTES = 2_000_000;
const MAX_CSS_BYTES = 400_000;
const MAX_PAGES = 12;

export type ScrapedPage = {
  url: string;
  path: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: number;
  images: string[];
  htmlBytes: number;
};

export type ScrapedSiteAnalysis = {
  sourceUrl: string;
  siteName: string;
  scannedAt: string;
  pagesScanned: number;
  pages: ScrapedPage[];
  brand: {
    colors: string[];
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fonts: string[];
    logoUrl: string;
    ogImageUrl: string;
  };
  layout: {
    hasHeader: boolean;
    hasNavigation: boolean;
    hasHero: boolean;
    hasMain: boolean;
    hasFooter: boolean;
    sectionCount: number;
    navLabels: string[];
    imageCount: number;
    responsiveViewport: boolean;
  };
  suggestions: string[];
  templateName: string;
};

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function cleanText(html: string): string {
  return decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function tagBlocks(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((match) => match[1] ?? '');
}

function attr(tag: string, name: string): string {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]?.trim() ?? '';
}

function tags(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

function usefulFonts(values: string[]): string[] {
  return unique(values.map((font) => font.trim().replace(/["']/g, '')).filter((font) => font && !['inherit', 'initial', 'unset', 'revert', 'monospace,monospace'].includes(font.toLowerCase()))).slice(0, 8);
}

function isPrivateIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168);
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return true;
}

async function safeUrl(raw: string, origin?: URL): Promise<URL> {
  const url = new URL(raw, origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) {
    throw new Error('Only public HTTP(S) URLs are allowed.');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local') || net.isIP(url.hostname) && isPrivateIp(url.hostname)) {
    throw new Error('Private and local network URLs are not allowed.');
  }
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) throw new Error('The requested host resolves to a private network.');
  if (origin && url.origin !== origin.origin) throw new Error('Crawl links must stay on the same public site.');
  url.hash = '';
  return url;
}

async function fetchText(url: URL, maxBytes: number): Promise<{ text: string; bytes: number; contentType: string }> {
  let current = url;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(current, { signal: controller.signal, redirect: 'manual', headers: { 'user-agent': 'OpenPage site inspector/1.0' } });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error('The site returned a redirect without a destination.');
        current = await safeUrl(location, url);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > maxBytes) throw new Error('The response is larger than the safe scan limit.');
      return { text: new TextDecoder().decode(buffer), bytes: buffer.byteLength, contentType };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Too many redirects.');
}

function extractColors(source: string): string[] {
  const colors = source.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? [];
  const counts = new Map<string, number>();
  for (const color of colors) counts.set(color.toLowerCase(), (counts.get(color.toLowerCase()) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([color]) => color).slice(0, 12);
}

function colorScore(color: string): number {
  const hex = color.match(/^#([0-9a-f]{3,6})$/i)?.[1];
  if (!hex) return color.startsWith('rgb') ? 0.5 : 0;
  const expanded = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
  const rgb = [0, 2, 4].map((index) => parseInt(expanded.slice(index, index + 2), 16) / 255);
  const max = Math.max(...rgb); const min = Math.min(...rgb);
  return max - min;
}

function pickColor(colors: string[], fallback: string, mode: 'accent' | 'background' | 'text'): string {
  if (mode === 'accent') return colors.find((color) => colorScore(color) > 0.18) ?? colors[0] ?? fallback;
  if (mode === 'background') return colors.find((color) => colorScore(color) < 0.08 && !/^#(?:fff|ffffff|000|000000)$/i.test(color)) ?? fallback;
  return colors.find((color) => colorScore(color) < 0.08) ?? fallback;
}

function extractPage(url: URL, html: string, bytes: number): { page: ScrapedPage; links: string[]; colors: string[]; fonts: string[]; navLabels: string[]; logoUrl: string; ogImageUrl: string; layout: ScrapedSiteAnalysis['layout'] } {
  const title = cleanText(tagBlocks(html, 'title')[0] ?? '') || url.hostname;
  const description = decodeEntities(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? '');
  const headings = unique(['h1', 'h2', 'h3'].flatMap((tag) => tagBlocks(html, tag).map(cleanText).filter(Boolean))).slice(0, 24);
  const images = unique(tags(html, 'img').map((tag) => attr(tag, 'src')).filter(Boolean).map((src) => new URL(src, url).href)).slice(0, 24);
  const links = unique(tags(html, 'a').map((tag) => attr(tag, 'href')).filter((href) => href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')).map((href) => { try { return new URL(href, url).href; } catch { return ''; } }).filter(Boolean));
  const navLabels = unique(tagBlocks(html, 'nav').flatMap((nav) => tagBlocks(nav, 'a').map(cleanText).filter(Boolean))).slice(0, 12);
  const styles = [...tagBlocks(html, 'style'), ...tags(html, 'body').map((tag) => attr(tag, 'style'))].join('\n');
  const colors = extractColors(styles);
  const fonts = usefulFonts([...styles.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((match) => match[1]));
  const logoTag = tags(html, 'img').find((tag) => /logo|brand|mark/i.test(`${attr(tag, 'alt')} ${attr(tag, 'class')} ${attr(tag, 'id')}`));
  const logoImage = images.find((image) => /logo|brand|mark/i.test(image));
  const logoUrl = logoTag ? new URL(attr(logoTag, 'src'), url).href : logoImage ?? '';
  const ogImage = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim() ?? '';
  const ogImageUrl = ogImage ? new URL(ogImage, url).href : '';
  const sectionCount = (html.match(/<section\b/gi) ?? []).length;
  const layout = {
    hasHeader: /<header\b/i.test(html),
    hasNavigation: /<nav\b/i.test(html),
    hasHero: /hero|banner|masthead/i.test(html.slice(0, 18000)) || /<h1\b/i.test(html),
    hasMain: /<main\b/i.test(html),
    hasFooter: /<footer\b/i.test(html),
    sectionCount,
    navLabels,
    imageCount: images.length,
    responsiveViewport: /<meta\b[^>]*name=["']viewport["']/i.test(html),
  };
  return {
    page: { url: url.href, path: url.pathname, title, description, headings, text: cleanText(html).slice(0, 1800), links: links.length, images, htmlBytes: bytes },
    links,
    colors,
    fonts,
    navLabels,
    logoUrl,
    ogImageUrl: ogImageUrl === url.href ? '' : ogImageUrl,
    layout,
  };
}

function suggestions(analysis: Omit<ScrapedSiteAnalysis, 'suggestions' | 'templateName'>): string[] {
  const results: string[] = [];
  if (!analysis.layout.hasHero || !analysis.pages.some((page) => page.headings.some((heading) => heading.length > 20))) results.push('Strengthen the first screen with one clear promise, supporting proof, and one primary call to action.');
  if (!analysis.layout.responsiveViewport) results.push('Add a responsive viewport and mobile-first spacing so the experience works cleanly on phones.');
  if (!analysis.layout.hasNavigation || analysis.layout.navLabels.length < 2) results.push('Simplify the navigation around the visitor’s top tasks and keep the primary action visible.');
  if (analysis.layout.imageCount > 0 && analysis.pages.every((page) => page.images.length > 0)) results.push('Audit image alt text, compression, and focal crops for accessibility and faster loading.');
  if (analysis.brand.colors.length < 3) results.push('Formalize the visual system with a background, text, muted, and accent token rather than one-off colors.');
  if (analysis.pages.some((page) => page.text.length > 1400)) results.push('Break long copy into scannable sections, comparison cards, and short editorial summaries.');
  results.push('Keep the existing brand colors, typography direction, logo, and content hierarchy as the source of truth while removing visual clutter.');
  return unique(results).slice(0, 6);
}

export async function scrapeWebsite(rawUrl: string, requestedMaxPages = 8): Promise<ScrapedSiteAnalysis> {
  const firstUrl = await safeUrl(rawUrl);
  const maxPages = Math.min(MAX_PAGES, Math.max(1, Math.floor(requestedMaxPages)));
  const queue = [firstUrl.href];
  const seen = new Set<string>();
  const pages: ScrapedPage[] = [];
  const colors: string[] = [];
  const fonts: string[] = [];
  const navLabels: string[] = [];
  let logoUrl = '';
  let ogImageUrl = '';
  let layout: ScrapedSiteAnalysis['layout'] = { hasHeader: false, hasNavigation: false, hasHero: false, hasMain: false, hasFooter: false, sectionCount: 0, navLabels: [], imageCount: 0, responsiveViewport: false };

  while (queue.length && pages.length < maxPages) {
    const next = queue.shift() ?? '';
    if (seen.has(next)) continue;
    seen.add(next);
    let url: URL;
    try { url = await safeUrl(next, firstUrl); } catch { continue; }
    try {
      const response = await fetchText(url, MAX_HTML_BYTES);
      if (!response.contentType.includes('text/html') && !response.contentType.includes('application/xhtml')) continue;
      const extracted = extractPage(url, response.text, response.bytes);
      pages.push(extracted.page);
      colors.push(...extracted.colors);
      fonts.push(...extracted.fonts);
      navLabels.push(...extracted.navLabels);
      logoUrl ||= extracted.logoUrl;
      ogImageUrl ||= extracted.ogImageUrl;
      layout = {
        hasHeader: layout.hasHeader || extracted.layout.hasHeader,
        hasNavigation: layout.hasNavigation || extracted.layout.hasNavigation,
        hasHero: layout.hasHero || extracted.layout.hasHero,
        hasMain: layout.hasMain || extracted.layout.hasMain,
        hasFooter: layout.hasFooter || extracted.layout.hasFooter,
        sectionCount: layout.sectionCount + extracted.layout.sectionCount,
        navLabels: unique([...layout.navLabels, ...extracted.layout.navLabels]).slice(0, 12),
        imageCount: layout.imageCount + extracted.layout.imageCount,
        responsiveViewport: layout.responsiveViewport || extracted.layout.responsiveViewport,
      };
      const stylesheetLinks = tags(response.text, 'link').filter((tag) => /stylesheet/i.test(attr(tag, 'rel'))).map((tag) => attr(tag, 'href')).filter(Boolean).slice(0, 4);
      for (const stylesheet of stylesheetLinks) {
        try {
          const cssUrl = await safeUrl(stylesheet, url);
          const css = await fetchText(cssUrl, MAX_CSS_BYTES);
          colors.push(...extractColors(css.text));
          fonts.push(...usefulFonts([...css.text.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((match) => match[1])));
        } catch {
          // A blocked or third-party stylesheet should not block the page scan.
        }
      }
      for (const link of extracted.links) if (!seen.has(link) && queue.length < maxPages * 3) queue.push(link);
    } catch {
      // One inaccessible page should not abort the rest of the same-origin scan.
    }
  }
  if (!pages.length) throw new Error('No readable HTML pages were found at that URL.');
  const siteName = pages[0].title.split(/[|–—-]/)[0]?.trim() || firstUrl.hostname;
  const brandColors = unique(colors).slice(0, 8);
  const analysisBase = { sourceUrl: firstUrl.href, siteName, scannedAt: new Date().toISOString(), pagesScanned: pages.length, pages, brand: { colors: brandColors, accentColor: pickColor(brandColors, '#d94f35', 'accent'), backgroundColor: pickColor(brandColors, '#f7f1e8', 'background'), textColor: pickColor(brandColors, '#201a18', 'text'), fonts: unique(fonts).slice(0, 6), logoUrl, ogImageUrl }, layout: { ...layout, navLabels: unique([...layout.navLabels, ...navLabels]).slice(0, 12) } };
  return { ...analysisBase, suggestions: suggestions(analysisBase), templateName: `${siteName} · brand template` };
}
