import { ElementorClient } from '@/lib/elementor-client';
import type { ElementorPage } from '@/lib/elementor-client';

export type ElementorPermission =
  | 'elementor.read'
  | 'elementor.pages.create'
  | 'elementor.pages.edit'
  | 'elementor.pages.publish'
  | 'elementor.pages.delete'
  | 'elementor.templates.access'
  | 'elementor.admin';

export interface ElementorAgentContext {
  agent: string;
  permissions: ElementorPermission[];
  siteId?: string;
}

export interface ElementorSiteConfig {
  siteId: string;
  siteName: string;
  siteUrl: string;
  username: string;
  appPassword: string;
  enabled: boolean;
  elementorInstalled?: boolean;
  elementorVersion?: string;
  bridgeInstalled?: boolean;
}

export interface ElementorSiteStatus {
  siteId: string;
  siteName: string;
  siteUrl: string;
  connected: boolean;
  elementorAvailable: boolean;
  elementorVersion?: string;
  bridgeAvailable?: boolean;
  lastCheckedAt: number;
  pageCount?: number;
  errorDetail?: string;
}

interface ElementorAuditLog {
  timestamp: number;
  actor: string;
  siteId: string;
  operation: string;
  pageId: string;
  pageName: string;
  result: 'success' | 'denied' | 'error';
  detail?: string;
}

class ElementorProvider {
  private sites: Map<string, { config: ElementorSiteConfig; client: ElementorClient }> = new Map();
  private auditLogs: ElementorAuditLog[] = [];
  private defaultPermissions: Map<string, ElementorPermission[]> = new Map([
    ['GBrain', ['elementor.read', 'elementor.templates.access']],
    ['ResearchAgent', ['elementor.read']],
    ['SEOAgent', ['elementor.read', 'elementor.pages.edit']],
    ['ContentAgent', ['elementor.read', 'elementor.pages.create', 'elementor.pages.edit']],
    ['WebsiteBuilder', ['elementor.read', 'elementor.pages.create', 'elementor.pages.edit']],
    ['MarketingAgent', ['elementor.read', 'elementor.pages.create', 'elementor.pages.edit']],
    ['PublishingAgent', ['elementor.read', 'elementor.pages.create', 'elementor.pages.edit', 'elementor.pages.publish']],
  ]);

  async registerSite(config: ElementorSiteConfig): Promise<ElementorSiteStatus> {
    if (this.sites.has(config.siteId)) {
      throw new Error(`Site ${config.siteId} already registered`);
    }

    const client = new ElementorClient({
      baseUrl: config.siteUrl,
      username: config.username,
      appPassword: config.appPassword,
    });

    try {
      const isAvailable = await client.isElementorAvailable();
      const version = await client.getElementorVersion();
      const bridge = await client.getBridgeHealth();

      if (!isAvailable) {
        throw new Error('Elementor plugin is not installed or not activated');
      }

      this.sites.set(config.siteId, {
        config: { ...config, elementorInstalled: true, elementorVersion: version || undefined, bridgeInstalled: true },
        client,
      });

      return {
        siteId: config.siteId,
        siteName: config.siteName,
        siteUrl: config.siteUrl,
        connected: true,
        elementorAvailable: true,
        elementorVersion: version || undefined,
        bridgeAvailable: bridge.ok,
        lastCheckedAt: Date.now(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to register site: ${message}`);
    }
  }

  getSite(siteId: string): ElementorClient | null {
    const entry = this.sites.get(siteId);
    return entry ? entry.client : null;
  }

  async listSites(): Promise<ElementorSiteStatus[]> {
    const sites: ElementorSiteStatus[] = [];

    for (const [siteId, { config, client }] of this.sites) {
      try {
        const isAvailable = await client.isElementorAvailable();
        const version = await client.getElementorVersion();
        const bridge = isAvailable ? await client.getBridgeHealth() : null;

        sites.push({
          siteId,
          siteName: config.siteName,
          siteUrl: config.siteUrl,
          connected: true,
          elementorAvailable: isAvailable,
          elementorVersion: version || undefined,
          bridgeAvailable: Boolean(bridge?.ok),
          lastCheckedAt: Date.now(),
        });
      } catch {
        sites.push({
          siteId,
          siteName: config.siteName,
          siteUrl: config.siteUrl,
          connected: false,
          elementorAvailable: false,
          lastCheckedAt: Date.now(),
        });
      }
    }

    return sites;
  }

  getPermissions(agent: string): ElementorPermission[] {
    return this.defaultPermissions.get(agent) || ['elementor.read'];
  }

  hasPermission(context: ElementorAgentContext, permission: ElementorPermission): boolean {
    return context.permissions.includes(permission);
  }

  canRead(context: ElementorAgentContext): boolean {
    return this.hasPermission(context, 'elementor.read');
  }

  canCreatePages(context: ElementorAgentContext): boolean {
    return this.hasPermission(context, 'elementor.pages.create');
  }

  canEditPages(context: ElementorAgentContext): boolean {
    return this.hasPermission(context, 'elementor.pages.edit');
  }

  canPublish(context: ElementorAgentContext): boolean {
    return this.hasPermission(context, 'elementor.pages.publish');
  }

  canDeletePages(context: ElementorAgentContext): boolean {
    return this.hasPermission(context, 'elementor.pages.delete');
  }

  private logAudit(log: ElementorAuditLog): void {
    this.auditLogs.push(log);
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }
  }

  checkOperation(
    context: ElementorAgentContext,
    operation: string,
  ): { allowed: boolean; reason?: string } {
    if (!context.siteId) {
      return { allowed: false, reason: 'No site specified' };
    }

    if (!this.sites.has(context.siteId)) {
      return { allowed: false, reason: 'Site not found' };
    }

    const permissionMap: Record<string, ElementorPermission> = {
      'listPages': 'elementor.read',
      'getPage': 'elementor.read',
      'createPage': 'elementor.pages.create',
      'updatePage': 'elementor.pages.edit',
      'publishPage': 'elementor.pages.publish',
      'deletePage': 'elementor.pages.delete',
      'duplicatePage': 'elementor.pages.create',
      'getPageMetadata': 'elementor.read',
      'getEditUrl': 'elementor.read',
      'getPreviewUrl': 'elementor.read',
      'listTemplates': 'elementor.templates.access',
      'getBridgeHealth': 'elementor.read',
      'getElementorStructure': 'elementor.read',
      'createElementorDraft': 'elementor.pages.create',
      'applyElementorChange': 'elementor.pages.edit',
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
        pageId: '',
        pageName: '',
        result: 'denied',
        detail: `Missing permission: ${requiredPermission}`,
      });
      return { allowed: false, reason: `Missing permission: ${requiredPermission}` };
    }

    return { allowed: true };
  }

  recordOperation(
    context: ElementorAgentContext,
    operation: string,
    pageId: string,
    pageName: string,
    result: 'success' | 'error',
    detail?: string,
  ): void {
    if (context.siteId) {
      this.logAudit({
        timestamp: Date.now(),
        actor: context.agent,
        siteId: context.siteId,
        operation,
        pageId,
        pageName,
        result,
        detail,
      });
    }
  }

  getAuditLogs(siteId?: string, limit = 100): ElementorAuditLog[] {
    let logs = this.auditLogs;
    if (siteId) {
      logs = logs.filter((l) => l.siteId === siteId);
    }
    return logs.slice(-limit);
  }
}

export const elementorProvider = new ElementorProvider();
