import { NextRequest, NextResponse } from 'next/server';
import { wordPressProvider } from '@/lib/wordpress-provider';
import type { WordPressAgentContext } from '@/lib/wordpress-provider';
import { runtimeEnv } from '@/lib/creds';

export const dynamic = 'force-dynamic';

interface ApiRequest {
  operation: string;
  siteId?: string;
  agent?: string;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

async function handleRequest(req: NextRequest, body: ApiRequest): Promise<NextResponse> {
  const { operation, siteId, agent = 'api', params = {}, data = {} } = body;

  if (!operation) {
    return NextResponse.json({ error: 'Missing operation' }, { status: 400 });
  }

  if (!siteId) {
    return NextResponse.json({ error: 'Missing siteId' }, { status: 400 });
  }

  // The primary site is configured through the existing server-side
  // environment, so Website Builder and agents can use the connector without
  // exposing credentials to the browser or requiring an in-memory setup step.
  if (siteId === 'primary' && !wordPressProvider.getSite(siteId)) {
    const { WORDPRESS_URL: siteUrl, WORDPRESS_USERNAME: username, WORDPRESS_APP_PASSWORD: appPassword } = runtimeEnv();
    if (siteUrl && username && appPassword) {
      try {
        await wordPressProvider.registerSite({
          siteId,
          siteName: 'Primary WordPress site',
          siteUrl,
          username,
          appPassword,
          enabled: true,
        });
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
      }
    }
  }

  const client = wordPressProvider.getSite(siteId);
  if (!client) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const context: WordPressAgentContext = {
    agent,
    permissions: wordPressProvider.getPermissions(agent),
    siteId,
  };

  const permCheck = wordPressProvider.checkOperation(context, operation, 'content');
  if (!permCheck.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', detail: permCheck.reason },
      { status: 403 },
    );
  }

  try {
    let result: unknown;

    switch (operation) {
      // Posts
      case 'listPosts':
        result = await client.listPosts(
          params as { page?: number; per_page?: number; status?: string },
        );
        break;

      case 'getPost':
        result = await client.getPost(params.id as number);
        break;

      case 'createPost':
        result = await client.createPost(data);
        wordPressProvider.recordOperation(
          context,
          operation,
          'post',
          String((result as any)?.id || ''),
          'success',
        );
        break;

      case 'updatePost':
        result = await client.updatePost(params.id as number, data);
        wordPressProvider.recordOperation(context, operation, 'post', String(params.id), 'success');
        break;

      case 'deletePost':
        result = await client.deletePost(params.id as number, (params.force as boolean) || false);
        wordPressProvider.recordOperation(context, operation, 'post', String(params.id), 'success');
        break;

      case 'publishPost':
        result = await client.publishPost(params.id as number);
        wordPressProvider.recordOperation(context, operation, 'post', String(params.id), 'success');
        break;

      case 'schedulePost':
        result = await client.schedulePost(params.id as number, params.dateGmt as string);
        wordPressProvider.recordOperation(context, operation, 'post', String(params.id), 'success');
        break;

      // Pages
      case 'listPages':
        result = await client.listPages(params as { page?: number; per_page?: number });
        break;

      case 'getPage':
        result = await client.getPage(params.id as number);
        break;

      case 'createPage':
        result = await client.createPage(data);
        wordPressProvider.recordOperation(context, operation, 'page', String((result as any)?.id || ''), 'success');
        break;

      case 'updatePage':
        result = await client.updatePage(params.id as number, data);
        wordPressProvider.recordOperation(context, operation, 'page', String(params.id), 'success');
        break;

      case 'deletePage':
        result = await client.deletePage(params.id as number, (params.force as boolean) || false);
        wordPressProvider.recordOperation(context, operation, 'page', String(params.id), 'success');
        break;

      // Media
      case 'listMedia':
        result = await client.listMedia(params as { page?: number; per_page?: number });
        break;

      case 'getMedia':
        result = await client.getMedia(params.id as number);
        break;

      case 'deleteMedia':
        result = await client.deleteMedia(params.id as number, (params.force as boolean) || false);
        wordPressProvider.recordOperation(context, operation, 'media', String(params.id), 'success');
        break;

      // Taxonomy
      case 'listCategories':
        result = await client.listCategories(params as { per_page?: number });
        break;

      case 'createCategory':
        result = await client.createCategory(data as { name: string; description?: string; parent?: number });
        wordPressProvider.recordOperation(context, operation, 'category', String((result as any)?.id || ''), 'success');
        break;

      case 'listTags':
        result = await client.listTags(params as { per_page?: number });
        break;

      case 'createTag':
        result = await client.createTag(data as { name: string; description?: string });
        wordPressProvider.recordOperation(context, operation, 'tag', String((result as any)?.id || ''), 'success');
        break;

      // Comments
      case 'listComments':
        result = await client.listComments(params.postId as number | undefined);
        break;

      case 'updateComment':
        result = await client.updateComment(params.id as number, data);
        wordPressProvider.recordOperation(context, operation, 'comment', String(params.id), 'success');
        break;

      // Users
      case 'listUsers':
        result = await client.listUsers();
        break;

      case 'getCurrentUser':
        result = await client.getCurrentUser();
        break;

      // Abilities
      case 'listAbilities':
        result = await client.listAbilities();
        break;

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    wordPressProvider.recordOperation(context, operation, 'unknown', '', 'error', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ApiRequest;
  return handleRequest(req, body);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const operation = url.searchParams.get('operation');
  const siteId = url.searchParams.get('siteId');
  const agent = url.searchParams.get('agent');
  const id = url.searchParams.get('id');

  const body: ApiRequest = {
    operation: operation || '',
    siteId: siteId || undefined,
    agent: agent || undefined,
    params: id ? { id: Number(id) } : {},
  };

  return handleRequest(req, body);
}
