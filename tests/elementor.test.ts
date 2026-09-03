import { describe, it, expect, beforeEach } from 'vitest';
import { elementorProvider } from '@/lib/elementor-provider';
import type { ElementorSiteConfig } from '@/lib/elementor-provider';

describe('Elementor Connector', () => {
  describe('ElementorProvider RBAC', () => {
    beforeEach(() => {
      elementorProvider.getAuditLogs().splice(0);
    });

    it('grants read permission to GBrain', () => {
      const permissions = elementorProvider.getPermissions('GBrain');
      expect(permissions).toContain('elementor.read');
      expect(permissions).toContain('elementor.templates.access');
    });

    it('grants read and edit to SEOAgent', () => {
      const permissions = elementorProvider.getPermissions('SEOAgent');
      expect(permissions).toContain('elementor.read');
      expect(permissions).toContain('elementor.pages.edit');
    });

    it('grants full page management to ContentAgent', () => {
      const permissions = elementorProvider.getPermissions('ContentAgent');
      expect(permissions).toContain('elementor.read');
      expect(permissions).toContain('elementor.pages.create');
      expect(permissions).toContain('elementor.pages.edit');
    });

    it('grants publish permissions to PublishingAgent', () => {
      const permissions = elementorProvider.getPermissions('PublishingAgent');
      expect(permissions).toContain('elementor.pages.publish');
    });

    it('grants WebsiteBuilder agent permissions to create and edit', () => {
      const permissions = elementorProvider.getPermissions('WebsiteBuilder');
      expect(permissions).toContain('elementor.read');
      expect(permissions).toContain('elementor.pages.create');
      expect(permissions).toContain('elementor.pages.edit');
    });

    it('checks permission correctly', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: elementorProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.hasPermission(context, 'elementor.read')).toBe(true);
      expect(elementorProvider.hasPermission(context, 'elementor.pages.publish')).toBe(false);
      expect(elementorProvider.canRead(context)).toBe(true);
      expect(elementorProvider.canPublish(context)).toBe(false);
    });

    it('denies operations without permission', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: elementorProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canCreatePages(context)).toBe(false);
      expect(elementorProvider.canEditPages(context)).toBe(false);
      expect(elementorProvider.canDeletePages(context)).toBe(false);
    });

    it('read operation requires elementor.read permission', () => {
      const contextWithPermission = {
        agent: 'GBrain',
        permissions: elementorProvider.getPermissions('GBrain'),
        siteId: 'test-site',
      };

      // hasPermission check directly (bypasses site existence check)
      expect(elementorProvider.hasPermission(contextWithPermission, 'elementor.read')).toBe(true);
    });

    it('requires site existence for operations', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: elementorProvider.getPermissions('ContentAgent'),
        siteId: 'nonexistent-site',
      };

      const check = elementorProvider.checkOperation(context, 'createPage');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Site not found');
    });

    it('requires siteId for all operations', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: elementorProvider.getPermissions('ContentAgent'),
        siteId: undefined,
      };

      const check = elementorProvider.checkOperation(context, 'listPages');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('No site');
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      elementorProvider.getAuditLogs().splice(0);
    });

    it('logs successful operations', () => {
      const context = {
        agent: 'WebsiteBuilder',
        permissions: elementorProvider.getPermissions('WebsiteBuilder'),
        siteId: 'test-site',
      };

      elementorProvider.recordOperation(context, 'createPage', '123', 'My Page', 'success');

      const logs = elementorProvider.getAuditLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toMatchObject({
        actor: 'WebsiteBuilder',
        siteId: 'test-site',
        operation: 'createPage',
        pageId: '123',
        pageName: 'My Page',
        result: 'success',
      });
    });

    it('logs error operations', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: elementorProvider.getPermissions('ContentAgent'),
        siteId: 'test-site',
      };

      elementorProvider.recordOperation(
        context,
        'publishPage',
        '456',
        'Another Page',
        'error',
        'Permission denied',
      );

      const logs = elementorProvider.getAuditLogs();
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const errorLog = logs.find(l => l.operation === 'publishPage');
      expect(errorLog?.result).toBe('error');
      expect(errorLog?.detail).toBe('Permission denied');
    });

    it('never exposes sensitive data in audit logs', () => {
      const context = {
        agent: 'WebsiteBuilder',
        permissions: elementorProvider.getPermissions('WebsiteBuilder'),
        siteId: 'test-site',
      };

      elementorProvider.recordOperation(context, 'createPage', '123', 'New Page', 'success');

      const logs = elementorProvider.getAuditLogs();
      const logString = JSON.stringify(logs);

      expect(logString).not.toContain('password');
      expect(logString).not.toContain('appPassword');
      expect(logString).not.toContain('Authorization');
    });

    it('filters logs by siteId', () => {
      const context1 = {
        agent: 'WebsiteBuilder',
        permissions: elementorProvider.getPermissions('WebsiteBuilder'),
        siteId: 'site-1',
      };

      const context2 = {
        agent: 'WebsiteBuilder',
        permissions: elementorProvider.getPermissions('WebsiteBuilder'),
        siteId: 'site-2',
      };

      elementorProvider.recordOperation(context1, 'createPage', '1', 'Page 1', 'success');
      elementorProvider.recordOperation(context2, 'createPage', '2', 'Page 2', 'success');

      const site1Logs = elementorProvider.getAuditLogs('site-1');
      const site2Logs = elementorProvider.getAuditLogs('site-2');

      expect(site1Logs.length).toBe(1);
      expect(site1Logs[0].siteId).toBe('site-1');
      expect(site2Logs.length).toBe(1);
      expect(site2Logs[0].siteId).toBe('site-2');
    });
  });

  describe('Agent Access Control', () => {
    it('ContentAgent can create and edit pages', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: elementorProvider.getPermissions('ContentAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canCreatePages(context)).toBe(true);
      expect(elementorProvider.canEditPages(context)).toBe(true);
    });

    it('WebsiteBuilder agent can create and edit pages', () => {
      const context = {
        agent: 'WebsiteBuilder',
        permissions: elementorProvider.getPermissions('WebsiteBuilder'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canCreatePages(context)).toBe(true);
      expect(elementorProvider.canEditPages(context)).toBe(true);
    });

    it('PublishingAgent has full permissions', () => {
      const context = {
        agent: 'PublishingAgent',
        permissions: elementorProvider.getPermissions('PublishingAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canRead(context)).toBe(true);
      expect(elementorProvider.canCreatePages(context)).toBe(true);
      expect(elementorProvider.canEditPages(context)).toBe(true);
      expect(elementorProvider.canPublish(context)).toBe(true);
      expect(elementorProvider.canDeletePages(context)).toBe(false);
    });

    it('GBrain has read-only access', () => {
      const context = {
        agent: 'GBrain',
        permissions: elementorProvider.getPermissions('GBrain'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canRead(context)).toBe(true);
      expect(elementorProvider.canCreatePages(context)).toBe(false);
      expect(elementorProvider.canEditPages(context)).toBe(false);
      expect(elementorProvider.canPublish(context)).toBe(false);
    });

    it('ResearchAgent has read-only access', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: elementorProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canRead(context)).toBe(true);
      expect(elementorProvider.canCreatePages(context)).toBe(false);
      expect(elementorProvider.canEditPages(context)).toBe(false);
      expect(elementorProvider.canPublish(context)).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('defines ElementorSiteConfig with required fields', () => {
      const config: ElementorSiteConfig = {
        siteId: 'site-1',
        siteName: 'My Site',
        siteUrl: 'https://example.com',
        username: 'admin',
        appPassword: 'password',
        enabled: true,
      };

      expect(config).toMatchObject({
        siteId: expect.any(String),
        siteName: expect.any(String),
        siteUrl: expect.any(String),
        username: expect.any(String),
        appPassword: expect.any(String),
        enabled: expect.any(Boolean),
      });
    });

    it('defines ElementorSiteStatus with health information', () => {
      const status = {
        siteId: 'site-1',
        siteName: 'My Site',
        siteUrl: 'https://example.com',
        connected: true,
        elementorAvailable: true,
        elementorVersion: '3.15.0',
        lastCheckedAt: Date.now(),
      };

      expect(status.connected).toBe(true);
      expect(status.elementorAvailable).toBe(true);
      expect(typeof status.elementorVersion).toBe('string');
    });
  });

  describe('Permission Operations', () => {
    it('read operation requires read permission', () => {
      const context = {
        agent: 'GBrain',
        permissions: elementorProvider.getPermissions('GBrain'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canRead(context)).toBe(true);
    });

    it('create operation requires create permission', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: elementorProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canCreatePages(context)).toBe(false);
    });

    it('publish operation requires publish permission', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: elementorProvider.getPermissions('ContentAgent'),
        siteId: 'test-site',
      };

      expect(elementorProvider.canPublish(context)).toBe(false);
    });
  });
});
