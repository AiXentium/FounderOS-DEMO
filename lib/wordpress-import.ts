import { z } from 'zod';
import type { FounderDb } from '@/lib/db';
import type { LlmToolSpec } from '@/lib/connectors/llm';
import { runtimeEnv } from '@/lib/creds';
import { wordPressProvider } from '@/lib/wordpress-provider';

type ImportedItem = {
  id: number;
  date?: string;
  modified?: string;
  slug?: string;
  status?: string;
  link?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  featured_media?: number;
  type?: string;
};

async function ensurePrimarySite() {
  const env = runtimeEnv();
  if (!wordPressProvider.getSite('primary')) {
    if (!env.WORDPRESS_URL || !env.WORDPRESS_USERNAME || !env.WORDPRESS_APP_PASSWORD) {
      throw new Error('WordPress is not configured — set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD first');
    }
    await wordPressProvider.registerSite({
      siteId: 'primary',
      siteName: 'Primary WordPress site',
      siteUrl: env.WORDPRESS_URL,
      username: env.WORDPRESS_USERNAME,
      appPassword: env.WORDPRESS_APP_PASSWORD,
      enabled: true,
    });
  }
  const client = wordPressProvider.getSite('primary');
  if (!client) throw new Error('Primary WordPress site is not registered');
  return { client, env };
}

async function listAll<T extends ImportedItem>(list: (page: number) => Promise<{ items: T[]; totalPages: number }>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await list(page);
    items.push(...result.items);
    if (result.items.length === 0 || page >= Math.max(result.totalPages, 1)) break;
  }
  return items;
}

export type WordPressImportResult = {
  ok: boolean;
  summary: string;
  imported: number;
  pages: number;
  posts: number;
  projectIds: string[];
  source: string;
};

/**
 * Copy WordPress pages/posts into local Website Builder draft projects.
 * This never creates, edits, publishes, or deletes anything in WordPress.
 */
export async function importWordPressContent(db: FounderDb): Promise<WordPressImportResult> {
  const { client, env } = await ensurePrimarySite();
  const [pages, posts] = await Promise.all([
    listAll((page) => client.listPages({ page, per_page: 100 })),
    listAll((page) => client.listPosts({ page, per_page: 100 })),
  ]);
  const now = new Date().toISOString();
  const projectIds: string[] = [];
  for (const item of [...pages.map((value) => ({ ...value, type: 'page' })), ...posts.map((value) => ({ ...value, type: 'post' }))]) {
    const type = item.type === 'page' ? 'page' : 'post';
    const title = item.title?.rendered?.trim() || `${type} ${item.id}`;
    const projectId = `wordpress-${type}-${item.id}`;
    const contentHtml = item.content?.rendered || '';
    db.websiteProjects.save({
      id: projectId,
      name: `WP ${type}: ${title}`,
      prompt: `Imported from WordPress ${type}: ${title}`,
      direction: 'wordpress-import',
      page: {
        title,
        blocks: ['Imported WordPress content'],
        generated: false,
        source: 'wordpress',
        sourceType: type,
        wordpressId: item.id,
        sourceUrl: item.link || '',
        status: item.status || '',
        contentHtml,
        excerptHtml: item.excerpt?.rendered || '',
        featuredMediaId: item.featured_media || 0,
        importedAt: now,
        domain: env.WORDPRESS_URL || '',
      },
      createdAt: item.date || now,
      updatedAt: item.modified || now,
    });
    projectIds.push(projectId);
  }
  return {
    ok: true,
    summary: `Imported ${projectIds.length} WordPress content items into Website Builder drafts (${pages.length} pages, ${posts.length} posts). WordPress was not changed.`,
    imported: projectIds.length,
    pages: pages.length,
    posts: posts.length,
    projectIds,
    source: env.WORDPRESS_URL || 'primary WordPress site',
  };
}

export function wordpressImportTool(): LlmToolSpec {
  return {
    name: 'importWordPressContent',
    description: 'Read all accessible WordPress pages and posts and save each as a local Website Builder draft. This is a safe local import only; it never changes, publishes, or deletes WordPress content.',
    parameters: z.object({}),
    execute: async () => {
      const { getDb } = await import('@/lib/data');
      return importWordPressContent(getDb());
    },
  };
}
