import { z } from 'zod';
import { WordPressClient } from '@/lib/wordpress-client';
import { runtimeEnv } from '@/lib/creds';
import type { LlmToolSpec } from '@/lib/connectors/llm';

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
