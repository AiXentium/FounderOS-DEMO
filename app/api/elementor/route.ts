import { NextRequest, NextResponse } from 'next/server';
import { elementorProvider } from '@/lib/elementor-provider';
import type { ElementorAgentContext } from '@/lib/elementor-provider';

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

  if (siteId === 'primary' && !elementorProvider.getSite(siteId)) {
    const { WORDPRESS_URL: siteUrl, WORDPRESS_USERNAME: username, WORDPRESS_APP_PASSWORD: appPassword } = process.env;
    if (siteUrl && username && appPassword) {
      try {
        await elementorProvider.registerSite({ siteId, siteName: 'Primary WordPress site', siteUrl, username, appPassword, enabled: true });
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
      }
    }
  }

  const client = elementorProvider.getSite(siteId);
  if (!client) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const context: ElementorAgentContext = {
    agent,
    permissions: elementorProvider.getPermissions(agent),
    siteId,
  };

  const permCheck = elementorProvider.checkOperation(context, operation);
  if (!permCheck.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', detail: permCheck.reason },
      { status: 403 },
    );
  }

  try {
    let result: unknown;

    switch (operation) {
      case 'listPages':
        result = await client.listPages(
          params as { page?: number; per_page?: number; elementorOnly?: boolean },
        );
        break;

      case 'getPage':
        result = await client.getPage(params.id as number);
        break;

      case 'createPage':
        result = await client.createPage({
          title: (data.title as string) || '',
          content: (data.content as string) || '',
          status: (data.status as 'draft' | 'publish') || 'draft',
        });
        elementorProvider.recordOperation(
          context,
          operation,
          String((result as any)?.id || ''),
          (data.title as string) || '',
          'success',
        );
        break;

      case 'updatePage':
        result = await client.updatePage(params.id as number, data);
        elementorProvider.recordOperation(context, operation, String(params.id), (data.title as string) || '', 'success');
        break;

      case 'publishPage':
        result = await client.publishPage(params.id as number);
        elementorProvider.recordOperation(context, operation, String(params.id), '', 'success');
        break;

      case 'deletePage':
        result = await client.deletePage(params.id as number, (params.force as boolean) || false);
        elementorProvider.recordOperation(context, operation, String(params.id), '', 'success');
        break;

      case 'duplicatePage':
        result = await client.duplicatePage(params.id as number);
        elementorProvider.recordOperation(
          context,
          operation,
          String((result as any)?.id || ''),
          (result as any)?.title || '',
          'success',
        );
        break;

      case 'getPageMetadata':
        result = await client.getPageMetadata(params.id as number);
        break;

      case 'getEditUrl':
        result = { editUrl: client.getEditUrl(params.id as number) };
        break;

      case 'getPreviewUrl':
        result = { previewUrl: client.getPreviewUrl(params.id as number) };
        break;

      case 'isElementorAvailable':
        result = { available: await client.isElementorAvailable() };
        break;

      case 'getElementorVersion':
        result = { version: await client.getElementorVersion() };
        break;

      case 'listTemplates':
        result = await client.listTemplates();
        break;

      case 'isPageBuiltWithElementor':
        result = { isBuilt: await client.isPageBuiltWithElementor(params.id as number) };
        break;

      case 'getElementorPageData':
        result = await client.getElementorPageData(params.id as number);
        break;

      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    elementorProvider.recordOperation(context, operation, '', '', 'error', message);
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

  const body: ApiRequest = {
    operation: operation || '',
    siteId: siteId || undefined,
    agent: agent || undefined,
  };

  return handleRequest(req, body);
}
