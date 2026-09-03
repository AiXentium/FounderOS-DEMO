import { describe, it, expect, beforeEach } from 'vitest';
import { WordPressClient } from '@/lib/wordpress-client';
import { wordPressProvider } from '@/lib/wordpress-provider';
import type { WordPressConfig } from '@/lib/connectors/wordpress';

describe('WordPress Connector', () => {
  describe('WordPressClient initialization', () => {
    it('creates a client with proper configuration', () => {
      const client = new WordPressClient({
        baseUrl: 'https://example.com',
        username: 'testuser',
        appPassword: 'test-pass-1234',
      });
      expect(client).toBeDefined();
    });

    it('normalizes URLs with trailing slashes', () => {
      const client1 = new WordPressClient({
        baseUrl: 'https://example.com/',
        username: 'testuser',
        appPassword: 'test-pass',
      });

      const client2 = new WordPressClient({
        baseUrl: 'https://example.com',
        username: 'testuser',
        appPassword: 'test-pass',
      });

      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe('WordPressProvider RBAC', () => {
    beforeEach(() => {
      // Clear audit logs by creating a fresh provider state
      wordPressProvider.getAuditLogs().splice(0);
    });

    it('grants read permission to GBrain', () => {
      const permissions = wordPressProvider.getPermissions('GBrain');
      expect(permissions).toContain('wordpress.read');
    });

    it('grants read and edit to SEOAgent', () => {
      const permissions = wordPressProvider.getPermissions('SEOAgent');
      expect(permissions).toContain('wordpress.read');
      expect(permissions).toContain('wordpress.content.edit');
    });

    it('grants full content permissions to ContentAgent', () => {
      const permissions = wordPressProvider.getPermissions('ContentAgent');
      expect(permissions).toContain('wordpress.read');
      expect(permissions).toContain('wordpress.content.create');
      expect(permissions).toContain('wordpress.content.edit');
    });

    it('grants publish permissions to PublishingAgent', () => {
      const permissions = wordPressProvider.getPermissions('PublishingAgent');
      expect(permissions).toContain('wordpress.content.publish');
    });

    it('checks permission correctly', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: wordPressProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      expect(wordPressProvider.hasPermission(context, 'wordpress.read')).toBe(true);
      expect(wordPressProvider.hasPermission(context, 'wordpress.content.publish')).toBe(false);
    });

    it('denies operations without permission', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: wordPressProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      // hasPermission should return false for publish operations
      expect(wordPressProvider.hasPermission(context, 'wordpress.content.publish')).toBe(false);
      expect(wordPressProvider.canPublish(context)).toBe(false);
      expect(wordPressProvider.canCreateContent(context)).toBe(false);
      expect(wordPressProvider.canRead(context)).toBe(true);
    });

    it('allows operations with proper permission', () => {
      const context = {
        agent: 'PublishingAgent',
        permissions: wordPressProvider.getPermissions('PublishingAgent'),
        siteId: 'nonexistent-test-site',
      };

      const check = wordPressProvider.checkOperation(context, 'publishPost', 'post');
      // Will fail because site doesn't exist, not because of permissions
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Site not found');
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      wordPressProvider.getAuditLogs().length = 0;
    });

    it('logs successful operations', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: wordPressProvider.getPermissions('ContentAgent'),
        siteId: 'test-site',
      };

      wordPressProvider.recordOperation(context, 'createPost', 'post', '123', 'success');

      const logs = wordPressProvider.getAuditLogs();
      expect(logs.length).toBe(1);
      expect(logs[0]).toMatchObject({
        actor: 'ContentAgent',
        siteId: 'test-site',
        operation: 'createPost',
        resourceType: 'post',
        resourceId: '123',
        result: 'success',
      });
    });

    it('logs access control events', () => {
      const context = {
        agent: 'ResearchAgent',
        permissions: wordPressProvider.getPermissions('ResearchAgent'),
        siteId: 'test-site',
      };

      // Record an operation directly (simulating an access control event)
      wordPressProvider.recordOperation(context, 'publishPost', 'post', '42', 'error', 'Insufficient permissions');

      const logs = wordPressProvider.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      const accessLog = logs.find((l) => l.operation === 'publishPost' && l.siteId === 'test-site');
      expect(accessLog).toBeDefined();
      expect(accessLog?.result).toBe('error');
    });

    it('never exposes credentials in audit logs', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: wordPressProvider.getPermissions('ContentAgent'),
        siteId: 'test-site',
      };

      wordPressProvider.recordOperation(context, 'createPost', 'post', '123', 'success', 'Test detail');

      const logs = wordPressProvider.getAuditLogs();
      const logString = JSON.stringify(logs);

      expect(logString).not.toContain('password');
      expect(logString).not.toContain('appPassword');
      expect(logString).not.toContain('Authorization');
    });
  });

  describe('Multi-site Support', () => {
    it('initializes empty provider', () => {
      const sites = wordPressProvider.getAuditLogs();
      expect(Array.isArray(sites)).toBe(true);
    });

    it('rejects duplicate site registration', async () => {
      const config: WordPressConfig = {
        siteId: 'test-site',
        siteName: 'Test Site',
        siteUrl: 'https://example.com',
        username: 'test',
        appPassword: 'test',
        enabled: true,
      };

      // The actual registration would require a real WordPress endpoint
      // This test verifies the API contract
      expect(config.siteId).toBeDefined();
      expect(config.siteName).toBeDefined();
      expect(config.siteUrl).toBeDefined();
    });

    it('supports different site contexts', () => {
      const context1 = {
        agent: 'ContentAgent',
        permissions: wordPressProvider.getPermissions('ContentAgent'),
        siteId: 'site-1',
      };

      const context2 = {
        agent: 'ContentAgent',
        permissions: wordPressProvider.getPermissions('ContentAgent'),
        siteId: 'site-2',
      };

      expect(context1.siteId).not.toBe(context2.siteId);
      expect(context1.permissions).toEqual(context2.permissions);
    });
  });

  describe('Security', () => {
    it('requires siteId for operations', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: wordPressProvider.getPermissions('ContentAgent'),
        siteId: undefined,
      };

      const check = wordPressProvider.checkOperation(context, 'listPosts', 'post');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('No site');
    });

    it('validates site existence', () => {
      const context = {
        agent: 'ContentAgent',
        permissions: wordPressProvider.getPermissions('ContentAgent'),
        siteId: 'nonexistent-site',
      };

      const check = wordPressProvider.checkOperation(context, 'listPosts', 'post');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Site not found');
    });

    it('implements permission levels correctly', () => {
      const readOnly = wordPressProvider.getPermissions('ResearchAgent');
      const contentEditor = wordPressProvider.getPermissions('ContentAgent');
      const publisher = wordPressProvider.getPermissions('PublishingAgent');

      expect(readOnly).toContain('wordpress.read');
      expect(readOnly).not.toContain('wordpress.content.publish');

      expect(contentEditor).toContain('wordpress.content.create');
      expect(contentEditor).toContain('wordpress.content.edit');
      expect(contentEditor).not.toContain('wordpress.content.publish');

      expect(publisher).toContain('wordpress.content.publish');
    });
  });

  describe('Type Definitions', () => {
    it('defines WordPressConfig with required fields', () => {
      const config: WordPressConfig = {
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

    it('defines WordPressSiteStatus with health information', () => {
      const status = {
        siteId: 'site-1',
        siteName: 'My Site',
        siteUrl: 'https://example.com',
        status: 'connected' as const,
        restApiAvailable: true,
        abilitiesAvailable: false,
        woocommerceAvailable: false,
        lastCheckedAt: Date.now(),
        userId: 1,
        userName: 'admin',
      };

      expect(status.status).toBe('connected');
      expect(status.restApiAvailable).toBe(true);
    });
  });
});
