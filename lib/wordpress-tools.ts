import { z } from 'zod';
import { WordPressClient } from '@/lib/wordpress-client';
import { runtimeEnv } from '@/lib/creds';
import type { LlmToolSpec } from '@/lib/connectors/llm';
import { ElementorClient } from '@/lib/elementor-client';

function primaryWordPressClient(): WordPressClient {
  const env = runtimeEnv();
  if (!env.WORDPRESS_URL || !env.WORDPRESS_USERNAME || !env.WORDPRESS_APP_PASSWORD) {
    throw new Error('WordPress is not configured. Set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD.');
  }
  return new WordPressClient({
    baseUrl: env.WORDPRESS_URL,
    username: env.WORDPRESS_USERNAME,
    appPassword: env.WORDPRESS_APP_PASSWORD,
  });
}

function primaryElementorClient(): ElementorClient {
  const env = runtimeEnv();
  if (!env.WORDPRESS_URL || !env.WORDPRESS_USERNAME || !env.WORDPRESS_APP_PASSWORD) {
    throw new Error('WordPress is not configured. Set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD.');
  }
  return new ElementorClient({
    baseUrl: env.WORDPRESS_URL,
    username: env.WORDPRESS_USERNAME,
    appPassword: env.WORDPRESS_APP_PASSWORD,
  });
}

/**
 * Real Elementor bridge tools. They fail honestly when the WordPress plugin is
 * not installed; they never fall back to changing rendered HTML or inventing
 * a successful edit.
 */
export function elementorBridgeTools(): LlmToolSpec[] {
  return [
    {
      name: 'checkElementorBridge',
      description: 'Check whether the Business OS Elementor Bridge plugin is installed on the primary WordPress site and return its real capabilities. Read-only.',
      parameters: z.object({}),
      execute: async () => primaryElementorClient().getBridgeHealth(),
    },
    {
      name: 'inspectElementorPage',
      description: 'Read the actual nested Elementor document for a WordPress page, including section/container/widget ids and settings. Use this before proposing or applying an edit. Read-only.',
      parameters: z.object({ pageId: z.number().int().positive().describe('WordPress page ID') }),
      execute: async (args) => primaryElementorClient().getElementorStructure(Number(args.pageId)),
    },
    {
      name: 'createElementorDraft',
      description: 'Create a real WordPress page draft through the Business OS Elementor Bridge. Use only when the operator explicitly asks to create a draft. Never publish it.',
      parameters: z.object({
        title: z.string().min(1).describe('draft page title'),
        content: z.string().optional().describe('optional fallback HTML content'),
        elements: z.array(z.record(z.unknown())).optional().describe('optional validated Elementor element tree'),
      }),
      execute: async (args) => primaryElementorClient().createElementorDraft({
        title: String(args.title),
        ...(typeof args.content === 'string' ? { content: args.content } : {}),
        ...(Array.isArray(args.elements) ? { elements: args.elements as any } : {}),
      }),
    },
    {
      name: 'applyElementorChange',
      description: 'Apply one explicit, bounded change to a real WordPress Elementor page draft through the bridge. Inspect the page first; use only when the operator explicitly requests the change. This does not publish.',
      parameters: z.object({
        pageId: z.number().int().positive().describe('WordPress page ID'),
        action: z.enum(['replace_text', 'update_settings', 'insert_element', 'remove_element', 'replace_document']),
        element_id: z.string().optional(),
        parent_id: z.string().optional(),
        search: z.string().optional(),
        replace: z.string().optional(),
        expected_count: z.number().int().nonnegative().optional(),
        settings: z.record(z.unknown()).optional(),
        element: z.record(z.unknown()).optional(),
        elements: z.array(z.record(z.unknown())).optional(),
      }),
      execute: async (args) => {
        const { pageId, ...change } = args;
        return primaryElementorClient().applyElementorChange(Number(pageId), change as any);
      },
    },
  ];
}

export function wordpressContentTools(): LlmToolSpec[] {
  return [
    {
      name: 'createWordPressDraft',
      description: 'Create a real WordPress post as a draft on the configured primary site. This changes WordPress but does not publish; use only when the operator explicitly asks to create a draft.',
      parameters: z.object({
        title: z.string().min(1).describe('post title'),
        content: z.string().min(1).describe('HTML or block content'),
        excerpt: z.string().optional().describe('optional excerpt'),
      }),
      execute: async (args) => {
        const client = primaryWordPressClient();
        const post = await client.createPost({
          // The REST write schema accepts plain strings; response fields are
          // represented as { rendered } in WordPressPost.
          title: String(args.title),
          content: String(args.content),
          ...(typeof args.excerpt === 'string' ? { excerpt: args.excerpt } : {}),
          status: 'draft',
        } as unknown as Partial<import('@/lib/wordpress-client').WordPressPost>);
        return { ok: true, id: post.id, status: post.status, link: post.link, title: post.title?.rendered };
      },
    },
    {
      name: 'publishWordPressPost',
      description: 'Publish an existing WordPress post by numeric ID. Use only after the operator explicitly approves publishing that exact post ID; never publish merely because they asked for a draft or campaign.',
      parameters: z.object({ id: z.number().int().positive().describe('existing WordPress post ID') }),
      execute: async (args) => {
        const client = primaryWordPressClient();
        const post = await client.publishPost(Number(args.id));
        return { ok: true, id: post.id, status: post.status, link: post.link, title: post.title?.rendered };
      },
    },
  ];
}
