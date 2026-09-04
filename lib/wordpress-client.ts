import type { ConnectorStatus } from '@/lib/connectors/types';

export interface WordPressClientConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
  timeout?: number;
}

export interface WordPressPost {
  id: number;
  date: string;
  dateGmt: string;
  guid: { rendered: string };
  modified: string;
  modifiedGmt: string;
  password: string;
  slug: string;
  status: 'draft' | 'pending' | 'private' | 'publish' | 'scheduled';
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  categories?: number[];
  tags?: number[];
}

export interface WordPressPage extends Omit<WordPressPost, 'type'> {
  type: 'page';
  parent: number;
  menu_order: number;
}

export interface WordPressMedia {
  id: number;
  date: string;
  dateGmt: string;
  guid: { rendered: string };
  modified: string;
  modifiedGmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  author: number;
  description: { rendered: string };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details?: Record<string, unknown>;
  source_url: string;
  meta: Record<string, unknown>;
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: Record<string, unknown>;
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: Record<string, unknown>;
}

export interface WordPressComment {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_email: string;
  author_url: string;
  date: string;
  dateGmt: string;
  content: { rendered: string };
  link: string;
  status: string;
  type: string;
  author_avatar_urls: Record<string, string>;
}

export interface WordPressUser {
  id: number;
  username: string;
  name: string;
  email: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: Record<string, string>;
  meta: Record<string, unknown>;
  roles?: string[];
}

export interface WordPressPaginatedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface WordPressError {
  code: string;
  message: string;
  data?: { status?: number };
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
      const error = (await response.json().catch(() => ({}))) as WordPressError;
      throw new Error(
        error.message || `WordPress API error: HTTP ${response.status}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

function extractPaginationFromHeaders(headers: Headers): { total: number; totalPages: number } {
  const total = parseInt(headers.get('X-WP-Total') || '0', 10);
  const totalPages = parseInt(headers.get('X-WP-TotalPages') || '0', 10);
  return { total, totalPages };
}

async function fetchPaginated<T>(
  url: string,
  authHeader: string,
  options: { timeout?: number } = {},
): Promise<{ items: T[]; total: number; totalPages: number }> {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`WordPress API error: HTTP ${response.status}`);
    }

    const items = (await response.json()) as T[];
    const { total, totalPages } = extractPaginationFromHeaders(response.headers);

    return { items, total, totalPages };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

export class WordPressClient {
  private baseUrl: string;
  private authHeader: string;
  private timeout: number;

  constructor(config: WordPressClientConfig) {
    this.baseUrl = normalizeUrl(config.baseUrl);
    this.authHeader = createAuthHeader(config.username, config.appPassword);
    this.timeout = config.timeout || 10000;
  }

  // Posts
  async listPosts(params?: { page?: number; per_page?: number; status?: string }): Promise<WordPressPaginatedResponse<WordPressPost>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.status) searchParams.append('status', params.status);

    const url = `${this.baseUrl}/wp-json/wp/v2/posts?${searchParams}`;
    const { items, total, totalPages } = await fetchPaginated<WordPressPost>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: params?.page || 1,
    };
  }

  async getPost(id: number): Promise<WordPressPost> {
    const url = `${this.baseUrl}/wp-json/wp/v2/posts/${id}`;
    return makeRequest<WordPressPost>(url, this.authHeader, { timeout: this.timeout });
  }

  async createPost(data: Partial<WordPressPost>): Promise<WordPressPost> {
    const url = `${this.baseUrl}/wp-json/wp/v2/posts`;
    return makeRequest<WordPressPost>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  async updatePost(id: number, data: Partial<WordPressPost>): Promise<WordPressPost> {
    const url = `${this.baseUrl}/wp-json/wp/v2/posts/${id}`;
    return makeRequest<WordPressPost>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  async deletePost(id: number, force = false): Promise<{ deleted: boolean }> {
    const url = `${this.baseUrl}/wp-json/wp/v2/posts/${id}?force=${force}`;
    return makeRequest<{ deleted: boolean }>(url, this.authHeader, {
      method: 'DELETE',
      timeout: this.timeout,
    });
  }

  async publishPost(id: number): Promise<WordPressPost> {
    return this.updatePost(id, { status: 'publish' });
  }

  async schedulePost(id: number, dateGmt: string): Promise<WordPressPost> {
    // WordPress API uses date_gmt in JSON request body
    const url = `${this.baseUrl}/wp-json/wp/v2/posts/${id}`;
    return makeRequest<WordPressPost>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify({ status: 'scheduled', date_gmt: dateGmt }),
      timeout: this.timeout,
    });
  }

  // Pages
  async listPages(params?: { page?: number; per_page?: number }): Promise<WordPressPaginatedResponse<WordPressPage>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());

    const url = `${this.baseUrl}/wp-json/wp/v2/pages?${searchParams}`;
    const { items, total, totalPages } = await fetchPaginated<WordPressPage>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: params?.page || 1,
    };
  }

  async getPage(id: number): Promise<WordPressPage> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages/${id}`;
    return makeRequest<WordPressPage>(url, this.authHeader, { timeout: this.timeout });
  }

  async createPage(data: Partial<WordPressPage>): Promise<WordPressPage> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages`;
    return makeRequest<WordPressPage>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  async updatePage(id: number, data: Partial<WordPressPage>): Promise<WordPressPage> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages/${id}`;
    return makeRequest<WordPressPage>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  async deletePage(id: number, force = false): Promise<{ deleted: boolean }> {
    const url = `${this.baseUrl}/wp-json/wp/v2/pages/${id}?force=${force}`;
    return makeRequest<{ deleted: boolean }>(url, this.authHeader, {
      method: 'DELETE',
      timeout: this.timeout,
    });
  }

  // Media
  async listMedia(params?: { page?: number; per_page?: number }): Promise<WordPressPaginatedResponse<WordPressMedia>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());

    const url = `${this.baseUrl}/wp-json/wp/v2/media?${searchParams}`;
    const { items, total, totalPages } = await fetchPaginated<WordPressMedia>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: params?.page || 1,
    };
  }

  async getMedia(id: number): Promise<WordPressMedia> {
    const url = `${this.baseUrl}/wp-json/wp/v2/media/${id}`;
    return makeRequest<WordPressMedia>(url, this.authHeader, { timeout: this.timeout });
  }

  async deleteMedia(id: number, force = false): Promise<{ deleted: boolean }> {
    const url = `${this.baseUrl}/wp-json/wp/v2/media/${id}?force=${force}`;
    return makeRequest<{ deleted: boolean }>(url, this.authHeader, {
      method: 'DELETE',
      timeout: this.timeout,
    });
  }

  // Categories
  async listCategories(params?: { per_page?: number }): Promise<WordPressPaginatedResponse<WordPressCategory>> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    else searchParams.append('per_page', '100');

    const url = `${this.baseUrl}/wp-json/wp/v2/categories?${searchParams}`;
    const { items, total, totalPages } = await fetchPaginated<WordPressCategory>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: 1,
    };
  }

  async createCategory(data: { name: string; description?: string; parent?: number }): Promise<WordPressCategory> {
    const url = `${this.baseUrl}/wp-json/wp/v2/categories`;
    return makeRequest<WordPressCategory>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  // Tags
  async listTags(params?: { per_page?: number }): Promise<WordPressPaginatedResponse<WordPressTag>> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    else searchParams.append('per_page', '100');

    const url = `${this.baseUrl}/wp-json/wp/v2/tags?${searchParams}`;
    const { items, total, totalPages } = await fetchPaginated<WordPressTag>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: 1,
    };
  }

  async createTag(data: { name: string; description?: string }): Promise<WordPressTag> {
    const url = `${this.baseUrl}/wp-json/wp/v2/tags`;
    return makeRequest<WordPressTag>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  // Comments
  async listComments(postId?: number): Promise<WordPressPaginatedResponse<WordPressComment>> {
    const searchParams = new URLSearchParams();
    if (postId) searchParams.append('post', postId.toString());
    searchParams.append('per_page', '100');

    const url = `${this.baseUrl}/wp-json/wp/v2/comments?${searchParams}`;
    const { items, total, totalPages } = await fetchPaginated<WordPressComment>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: 1,
    };
  }

  async updateComment(id: number, data: Partial<WordPressComment>): Promise<WordPressComment> {
    const url = `${this.baseUrl}/wp-json/wp/v2/comments/${id}`;
    return makeRequest<WordPressComment>(url, this.authHeader, {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: this.timeout,
    });
  }

  // Users
  async listUsers(): Promise<WordPressPaginatedResponse<WordPressUser>> {
    const url = `${this.baseUrl}/wp-json/wp/v2/users?per_page=100`;
    const { items, total, totalPages } = await fetchPaginated<WordPressUser>(url, this.authHeader, { timeout: this.timeout });

    return {
      items,
      total,
      totalPages,
      currentPage: 1,
    };
  }

  async getCurrentUser(): Promise<WordPressUser> {
    const url = `${this.baseUrl}/wp-json/wp/v2/users/me`;
    return makeRequest<WordPressUser>(url, this.authHeader, { timeout: this.timeout });
  }

  /** Verify authenticated content access without requiring user-list permission. */
  async verifyContentAccess(): Promise<void> {
    const url = `${this.baseUrl}/wp-json/wp/v2/posts?context=edit&per_page=1`;
    await makeRequest<unknown[]>(url, this.authHeader, { timeout: this.timeout });
  }

  // Abilities API (WordPress 6.9+)
  async hasAbilitiesApi(): Promise<boolean> {
    try {
      await makeRequest<unknown>(
        `${this.baseUrl}/wp-json/wp-abilities/v1/`,
        this.authHeader,
        { timeout: this.timeout },
      );
      return true;
    } catch {
      return false;
    }
  }

  async listAbilities(): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/wp-json/wp-abilities/v1/abilities`;
    return makeRequest<Record<string, unknown>>(url, this.authHeader, { timeout: this.timeout });
  }
}
