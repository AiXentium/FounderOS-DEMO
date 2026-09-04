import { WordPressClient } from '@/lib/wordpress-client';
import type { WordPressConfig, WordPressSiteStatus } from '@/lib/connectors/wordpress';

export type WordPressPermission =
  | 'wordpress.read'
  | 'wordpress.content.create'
  | 'wordpress.content.edit'
  | 'wordpress.content.publish'
  | 'wordpress.content.delete'
  | 'wordpress.media.read'
  | 'wordpress.media.write'
  | 'wordpress.users.read'
  | 'wordpress.admin';

export interface WordPressAgentContext {
  agent: string;
  permissions: WordPressPermission[];
  siteId?: string;
}

export interface WordPressAuditLog {
  timestamp: number;
  actor: string;
  siteId: string;
  operation: string;
  resourceType: string;
  resourceId: string;
  result: 'success' | 'denied' | 'error';
  detail?: string;
}

class WordPressProvider {
  private sites: Map<string, { config: WordPressConfig; client: WordPressClient }> = new Map();
  private auditLogs: WordPressAuditLog[] = [];
  private defaultPermissions: Map<string, WordPressPermission[]> = new Map([
    ['GBrain', ['wordpress.read']],
    ['ResearchAgent', ['wordpress.read']],
    ['SEOAgent', ['wordpress.read', 'wordpress.content.edit']],
    ['ContentAgent', ['wordpress.read', 'wordpress.content.create', 'wordpress.content.edit']],
    ['MarketingAgent', ['wordpress.read', 'wordpress.content.create', 'wordpress.content.edit']],
    ['PublishingAgent', ['wordpress.read', 'wordpress.content.create', 'wordpress.content.edit', 'wordpress.content.publish']],
  ]);

  async registerSite(config: WordPressConfig): Promise<WordPressSiteStatus> {
    if (this.sites.has(config.siteId)) {
      throw new Error(`Site ${config.siteId} already registered`);
    }

    const client = new WordPressClient({
      baseUrl: config.siteUrl,
      username: config.username,
      appPassword: config.appPassword,
    });

    try {
      // Content access is the capability this provider needs. A user can have
      // valid editor/author access while WordPress forbids /users/me because
      // the profile endpoint is restricted to users with list-users access.
      await client.verifyContentAccess();
      let user: Awaited<ReturnType<WordPressClient['getCurrentUser']>> | undefined;
      try {
        user = await client.getCurrentUser();
      } catch {
        // Keep the site connected; the profile endpoint is optional metadata.
      }
      const hasAbilities = await client.hasAbilitiesApi();

      this.sites.set(config.siteId, { config, client });

      return {
        siteId: config.siteId,
        siteName: config.siteName,
        siteUrl: config.siteUrl,
        status: 'connected',
        restApiAvailable: true,
        abilitiesAvailable: hasAbilities,
        woocommerceAvailable: false,
        lastCheckedAt: Date.now(),
        userId: user?.id,
        userName: user?.name || 'Authenticated WordPress user',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('401')) {
        throw new Error('Authentication failed - invalid credentials');
      }
      if (message.includes('403')) {
        throw new Error('Insufficient permissions - user lacks authenticated content access');
      }
      throw new Error(`Failed to register site: ${message}`);
    }
  }

  getSite(siteId: string): WordPressClient | null {
    const entry = this.sites.get(siteId);
    return entry ? entry.client : null;
  }

  async listSites(): Promise<WordPressSiteStatus[]> {
    const sites: WordPressSiteStatus[] = [];

    for (const [siteId, { config, client }] of this.sites) {
      try {
        await client.verifyContentAccess();
        let user: Awaited<ReturnType<WordPressClient['getCurrentUser']>> | undefined;
        try {
          user = await client.getCurrentUser();
        } catch {
          // Profile metadata is optional when the WordPress role cannot list users.
        }
        const hasAbilities = await client.hasAbilitiesApi();

        sites.push({
          siteId,
          siteName: config.siteName,
          siteUrl: config.siteUrl,
          status: 'connected',
          restApiAvailable: true,
          abilitiesAvailable: hasAbilities,
          woocommerceAvailable: false,
          lastCheckedAt: Date.now(),
          userId: user?.id,
          userName: user?.name || 'Authenticated WordPress user',
        });
      } catch {
        sites.push({
          siteId,
          siteName: config.siteName,
          siteUrl: config.siteUrl,
          status: 'auth_failed',
          restApiAvailable: false,
          abilitiesAvailable: false,
          woocommerceAvailable: false,
          lastCheckedAt: Date.now(),
        });
      }
    }

    return sites;
  }

  getPermissions(agent: string): WordPressPermission[] {
    return this.defaultPermissions.get(agent) || ['wordpress.read'];
  }

  hasPermission(context: WordPressAgentContext, permission: WordPressPermission): boolean {
    return context.permissions.includes(permission);
  }

  canRead(context: WordPressAgentContext): boolean {
    return this.hasPermission(context, 'wordpress.read');
  }

  canCreateContent(context: WordPressAgentContext): boolean {
    return this.hasPermission(context, 'wordpress.content.create');
  }

  canEditContent(context: WordPressAgentContext): boolean {
    return this.hasPermission(context, 'wordpress.content.edit');
  }

  canPublish(context: WordPressAgentContext): boolean {
    return this.hasPermission(context, 'wordpress.content.publish');
  }

  canDeleteContent(context: WordPressAgentContext): boolean {
    return this.hasPermission(context, 'wordpress.content.delete');
  }

  private logAudit(log: WordPressAuditLog): void {
    this.auditLogs.push(log);
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }
  }

  checkOperation(
    context: WordPressAgentContext,
    operation: string,
    resourceType: string,
  ): { allowed: boolean; reason?: string } {
    if (!context.siteId) {
      return { allowed: false, reason: 'No site specified' };
    }

    if (!this.sites.has(context.siteId)) {
      return { allowed: false, reason: 'Site not found' };
    }

    const permissionMap: Record<string, WordPressPermission> = {
      'listPosts': 'wordpress.read',
      'getPost': 'wordpress.read',
      'createPost': 'wordpress.content.create',
      'updatePost': 'wordpress.content.edit',
      'publishPost': 'wordpress.content.publish',
      'deletePost': 'wordpress.content.delete',
      'listPages': 'wordpress.read',
      'getPage': 'wordpress.read',
      'createPage': 'wordpress.content.create',
      'updatePage': 'wordpress.content.edit',
      'deletePage': 'wordpress.content.delete',
      'listMedia': 'wordpress.media.read',
      'uploadMedia': 'wordpress.media.write',
      'deleteMedia': 'wordpress.media.write',
      'listCategories': 'wordpress.read',
      'createCategory': 'wordpress.content.create',
      'listTags': 'wordpress.read',
      'createTag': 'wordpress.content.create',
      'listComments': 'wordpress.read',
      'updateComment': 'wordpress.content.edit',
      'listUsers': 'wordpress.users.read',
    };

    const requiredPermission = permissionMap[operation];
    if (!requiredPermission) {
      return { allowed: false, reason: 'Unknown operation' };
    }

    if (!this.hasPermission(context, requiredPermission)) {
      this.logAudit({
        timestamp: Date.now(),
        actor: context.agent,
        siteId: context.siteId,
        operation,
        resourceType,
        resourceId: '',
        result: 'denied',
        detail: `Missing permission: ${requiredPermission}`,
      });
      return { allowed: false, reason: `Missing permission: ${requiredPermission}` };
    }

    return { allowed: true };
  }

  recordOperation(
    context: WordPressAgentContext,
    operation: string,
    resourceType: string,
    resourceId: string,
    result: 'success' | 'error',
    detail?: string,
  ): void {
    if (context.siteId) {
      this.logAudit({
        timestamp: Date.now(),
        actor: context.agent,
        siteId: context.siteId,
        operation,
        resourceType,
        resourceId,
        result,
        detail,
      });
    }
  }

  getAuditLogs(siteId?: string, limit = 100): WordPressAuditLog[] {
    let logs = this.auditLogs;
    if (siteId) {
      logs = logs.filter((l) => l.siteId === siteId);
    }
    return logs.slice(-limit);
  }
}

export const wordPressProvider = new WordPressProvider();
