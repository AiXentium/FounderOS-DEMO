import type { WordPressPost } from '@/lib/wordpress-client';

export interface ElementorPage {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'pending' | 'private' | 'publish';
  author: number;
  date: string;
  modified: string;
  link: string;
  elementorData?: unknown;
  editUrl: string;
  isBuiltWithElementor: boolean;
  templateType?: string;
  elementorVersion?: string;
}

export interface ElementorTemplate {
  id: number;
  title: string;
  type: 'page' | 'section' | 'widget' | 'kit';
  preview_url: string;
  thumbnail: string;
  elementor_version?: string;
}

export interface ElementorWidgetData {
  id: string;
  elType: 'widget' | 'column' | 'section';
  settings: Record<string, unknown>;
  elements?: ElementorWidgetData[];
}

export interface ElementorPageData {
  id: number;
  title: string;
  status: string;
  content: string;
  excerpt: string;
  author: number;
  date: string;
  modified: string;
  link: string;
  elementor_data?: ElementorWidgetData[];
  elementor_version?: string;
  elementor_library_type?: string;
}

function createAuthHeader(username: string, appPassword: string): string {
  const credentials = `${username}:${appPassword}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function makeRequest<T>(
  url: string,
  authHeader: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<T> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(
        error.message || `Elementor API error: HTTP ${response.status}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

export class ElementorClient {
  private baseUrl: string;
  private authHeader: string;
  private timeout: number;
  private wordPressBaseUrl: string;

  constructor(config: {
    baseUrl: string;
    username: string;
    appPassword: string;
    timeout?: number;
  }) {
    this.baseUrl = normalizeUrl(config.baseUrl);
    this.wordPressBaseUrl = this.baseUrl;
    this.authHeader = createAuthHeader(config.username, config.appPassword);
    this.timeout = config.timeout || 10000;
  }

  // Check if Elementor is installed
  async isElementorAvailable(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/wp-json/elementor/v1/`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
        redirect: 'follow',
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Get Elementor version
  async getElementorVersion(): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/wp-json/elementor/v1/about`;
      const data = await makeRequest<{ version?: string }>(url, this.authHeader, {
        timeout: this.timeout,
      });
      return data.version || null;
    } catch {
      return null;
    }
  }

  // List all pages (both Elementor and regular)
  async listPages(params?: {
    page?: number;
    per_page?: number;
    elementorOnly?: boolean;
  }): Promise<{
    items: ElementorPage[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    else searchParams.append('per_page', '50');

    const url = `${this.baseUrl}/wp-json/wp/v2/pages?${searchParams}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
        redirect: 'follow',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const pages = (await response.json()) as WordPressPost[];
      const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

      // Enrich with Elementor data
      const elementorPages: ElementorPage[] = await Promise.all(
        pages.map(async (page) => {
          const isBuiltWithElementor = await this.isPageBuiltWithElementor(page.id);
          const editUrl = `${this.wordPressBaseUrl}/wp-admin/post.php?post=${page.id}&action=elementor`;

          return {
            id: page.id,
            title: page.title.rendered,
            slug: page.slug,
            status: page.status as any,
            author: page.author,
            date: page.date,
            modified: page.modified,
            link: page.link,
            editUrl,
            isBuiltWithElementor,
          };
        }),
      );

      // Filter if elementorOnly is requested
      const filtered = params?.elementorOnly
        ? elementorPages.filter((p) => p.isBuiltWithElementor)
        : elementorPages;

      return {
        items: filtered,
        total,
        totalPages,
        currentPage: params?.page || 1,
      };
    } catch (error) {
      throw new Error(`Failed to list pages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get single page with Elementor data
  async getPage(id: number): Promise<ElementorPage> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages/${id}`;
    const page = await makeRequest<WordPressPost>(url, this.authHeader, {
      timeout: this.timeout,
    });

    const isBuiltWithElementor = await this.isPageBuiltWithElementor(id);
    const editUrl = `${this.wordPressBaseUrl}/wp-admin/post.php?post=${id}&action=elementor`;

    return {
      id: page.id,
      title: page.title.rendered,
      slug: page.slug,
      status: page.status as any,
      author: page.author,
      date: page.date,
      modified: page.modified,
      link: page.link,
      editUrl,
      isBuiltWithElementor,
    };
  }

  // Check if a specific page is built with Elementor
  async isPageBuiltWithElementor(pageId: number): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/wp-json/elementor/v1/pages/${pageId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
        redirect: 'follow',
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Get Elementor page data
  async getElementorPageData(pageId: number): Promise<ElementorPageData | null> {
    try {
      const url = `${this.baseUrl}/wp-json/elementor/v1/pages/${pageId}`;
      return await makeRequest<ElementorPageData>(url, this.authHeader, {
        timeout: this.timeout,
      });
    } catch {
      return null;
    }
  }

  // Create a new page with Elementor
  async createPage(data: {
    title: string;
    content?: string;
    status?: 'draft' | 'publish';
  }): Promise<ElementorPage> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages`;
    const page = await makeRequest<WordPressPost>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        content: data.content || '',
        status: data.status || 'draft',
      }),
      timeout: this.timeout,
    });

    const editUrl = `${this.wordPressBaseUrl}/wp-admin/post.php?post=${page.id}&action=elementor`;

    return {
      id: page.id,
      title: page.title.rendered,
      slug: page.slug,
      status: page.status as any,
      author: page.author,
      date: page.date,
      modified: page.modified,
      link: page.link,
      editUrl,
      isBuiltWithElementor: false,
    };
  }

  // Update page title and status
  async updatePage(id: number, data: { title?: string; status?: string }): Promise<ElementorPage> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages/${id}`;
    const page = await makeRequest<WordPressPost>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });

    const isBuiltWithElementor = await this.isPageBuiltWithElementor(id);
    const editUrl = `${this.wordPressBaseUrl}/wp-admin/post.php?post=${id}&action=elementor`;

    return {
      id: page.id,
      title: page.title.rendered,
      slug: page.slug,
      status: page.status as any,
      author: page.author,
      date: page.date,
      modified: page.modified,
      link: page.link,
      editUrl,
      isBuiltWithElementor,
    };
  }

  // Publish a page
  async publishPage(id: number): Promise<ElementorPage> {
    return this.updatePage(id, { status: 'publish' });
  }

  // Delete a page
  async deletePage(id: number, force = false): Promise<{ deleted: boolean }> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages/${id}?force=${force}`;
    return makeRequest<{ deleted: boolean }>(url, this.authHeader, {
      method: 'DELETE',
      timeout: this.timeout,
    });
  }

  // Get Elementor templates
  async listTemplates(): Promise<ElementorTemplate[]> {
    try {
      const url = `${this.baseUrl}/wp-json/elementor/v1/templates`;
      return await makeRequest<ElementorTemplate[]>(url, this.authHeader, {
        timeout: this.timeout,
      });
    } catch {
      return [];
    }
  }

  // Duplicate a page
  async duplicatePage(id: number): Promise<ElementorPage> {
    try {
      // Get source page
      const source = await this.getPage(id);

      // Create new page
      const newPage = await this.createPage({
        title: `${source.title} (Copy)`,
        status: 'draft',
      });

      // If original was built with Elementor, copy the Elementor data
      if (source.isBuiltWithElementor) {
        const elementorData = await this.getElementorPageData(id);
        if (elementorData?.elementor_data) {
          // This would need Elementor's update endpoint
          // For now, mark as needing manual rebuild
        }
      }

      return newPage;
    } catch (error) {
      throw new Error(
        `Failed to duplicate page: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Get page metadata (title, author, date, status)
  async getPageMetadata(id: number): Promise<{
    id: number;
    title: string;
    author: string;
    date: string;
    modified: string;
    status: string;
    editUrl: string;
  } | null> {
    try {
      const page = await this.getPage(id);
      return {
        id: page.id,
        title: page.title,
        author: `User ${page.author}`,
        date: page.date,
        modified: page.modified,
        status: page.status,
        editUrl: page.editUrl,
      };
    } catch {
      return null;
    }
  }

  // Get page edit URL (for iframe embedding)
  getEditUrl(pageId: number): string {
    return `${this.wordPressBaseUrl}/wp-admin/post.php?post=${pageId}&action=elementor`;
  }

  // Get page preview URL
  getPreviewUrl(pageId: number): string {
    return `${this.wordPressBaseUrl}/?p=${pageId}&preview=true`;
  }
}
