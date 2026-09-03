# Business OS Connectors Overview

Business OS includes two fully integrated connectors for managing WordPress websites and Elementor-built pages. Both are designed for agent integration and multi-site management.

## Quick Summary

| Connector | Purpose | Agents | Multi-Site | Audit Logging |
|-----------|---------|--------|------------|---------------|
| **WordPress** | Posts, pages, media, taxonomy | 6 types | ✅ Yes | ✅ Yes |
| **Elementor** | Visual page builder, templates | 7 types | ✅ Yes | ✅ Yes |

## WordPress Connector

**What:** Comprehensive WordPress REST API client with multi-site support, RBAC, and audit logging.

**Features:**
- Post & page management (CRUD, publish, schedule)
- Media library operations
- Taxonomy management (categories, tags)
- User & comment management
- Abilities API detection (WordPress 6.9+)
- WooCommerce detection

**Default Agent Permissions:**

```
GBrain          → read
ResearchAgent   → read
SEOAgent        → read, edit content
ContentAgent    → read, create, edit
WebsiteBuilder  → read, create, edit
MarketingAgent  → read, create, edit
PublishingAgent → read, create, edit, publish, admin
```

**Files:**
- `lib/wordpress-client.ts` (442 lines) — REST API client
- `lib/wordpress-provider.ts` (218 lines) — RBAC & multi-site
- `lib/connectors/wordpress.ts` (87 lines) — Status checker
- `app/api/wordpress/route.ts` (177 lines) — API endpoints
- `tests/wordpress.test.ts` (313 lines) — 20 passing tests

**Setup:**
```env
WORDPRESS_URL=https://yourdomain.com
WORDPRESS_USERNAME=your-email@example.com
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

## Elementor Connector

**What:** Full Elementor page builder integration built on top of WordPress, with visual builder awareness.

**Features:**
- Page management with Elementor detection
- Edit URLs (to open in Elementor editor)
- Preview URLs
- Page duplication
- Template library access
- Elementor version detection
- Status checking

**Default Agent Permissions:**

```
GBrain          → read, templates
ResearchAgent   → read
SEOAgent        → read, edit
ContentAgent    → read, create, edit
WebsiteBuilder  → read, create, edit
MarketingAgent  → read, create, edit
PublishingAgent → read, create, edit, publish
```

**Files:**
- `lib/elementor-client.ts` (435 lines) — REST API client
- `lib/elementor-provider.ts` (240 lines) — RBAC & multi-site
- `lib/connectors/elementor.ts` (75 lines) — Status checker
- `app/api/elementor/route.ts` (160 lines) — API endpoints
- `tests/elementor.test.ts` (320 lines) — 24 passing tests

**Setup:**
Uses same credentials as WordPress connector (runs on the same WordPress installation).

## Agent Workflows

### Content Agent: Create & Edit
```typescript
// Create a draft page
const page = await elementorClient.createPage({
  title: "Campaign Page",
  status: "draft"
});

// Hand off to WebsiteBuilder for visual editing
const editUrl = elementorClient.getEditUrl(page.id);

// Update metadata
await elementorClient.updatePage(page.id, {
  title: "Campaign - Updated Title"
});
```

### Publishing Agent: Publish Workflow
```typescript
// Verify it's Elementor-built
const page = await elementorClient.getPage(pageId);
if (!page.isBuiltWithElementor) throw new Error("Not an Elementor page");

// Publish to production
const published = await elementorClient.publishPage(pageId);
console.log(`Live at: ${published.link}`);
```

### Website Builder: Create & Design
```typescript
// Create new page
const page = await elementorClient.createPage({
  title: "New Service Page",
  status: "draft"
});

// Get edit URL
const editUrl = elementorClient.getEditUrl(page.id);

// WebsiteBuilder (or human) now edits in Elementor visual editor
```

### GBrain: Index Content
```typescript
// Get all Elementor pages for knowledge base
const pages = await elementorClient.listPages({
  elementorOnly: true,
  per_page: 100
});

// Ingest into Brain
for (const page of pages.items) {
  await gBrain.ingest({
    source: "elementor",
    siteId: "main",
    pageId: page.id,
    title: page.title,
    url: page.link,
  });
}
```

## API Endpoints

### WordPress
```
POST /api/wordpress
GET /api/wordpress?operation=...&siteId=...
```

Operations: `listPosts`, `getPost`, `createPost`, `updatePost`, `deletePost`, `publishPost`, `schedulePost`, `listPages`, `getPage`, `createPage`, `updatePage`, `deletePage`, `listMedia`, `getMedia`, `deleteMedia`, `listCategories`, `createCategory`, `listTags`, `createTag`, `listComments`, `updateComment`, `listUsers`, `getCurrentUser`, `listAbilities`

### Elementor
```
POST /api/elementor
GET /api/elementor?operation=...&siteId=...
```

Operations: `listPages`, `getPage`, `createPage`, `updatePage`, `publishPage`, `deletePage`, `duplicatePage`, `getPageMetadata`, `getEditUrl`, `getPreviewUrl`, `isElementorAvailable`, `getElementorVersion`, `listTemplates`, `isPageBuiltWithElementor`, `getElementorPageData`

## Security & Compliance

### RBAC (Role-Based Access Control)
- **6-9 permission levels per connector**
- **Enforced at API boundary** — permission check before operation
- **Agent-specific defaults** — each agent type has specific permissions
- **Deny by default** — only granted permissions are allowed

### Audit Logging
- **Every operation logged** — actor, operation, result, timestamp
- **Sensitive data masking** — no credentials in logs
- **Filterable by site** — multi-site audit isolation
- **Error detail capture** — reason for failed operations

### Credential Management
- **No credential exposure** — never returned in API responses
- **Application Passwords** — HTTP Basic Auth (WordPress standard)
- **Multi-site isolation** — per-site credential storage
- **Secure defaults** — SSRF protection, URL validation

## Testing

All connectors include comprehensive test suites:

```bash
# Run connector tests
npm test -- wordpress.test.ts   # 20 tests
npm test -- elementor.test.ts   # 24 tests

# Run full suite
npm test
```

**Coverage:**
- RBAC enforcement (per-agent permissions)
- Audit logging (operation recording, filtering)
- Multi-site isolation (site-level separation)
- Type safety (TypeScript enforcement)
- Security (credential masking)

## Status Checking

Both connectors provide status endpoints for Health monitoring:

### WordPress Status
- URL normalization & validation
- REST API availability
- Abilities API detection (WordPress 6.9+)
- WooCommerce detection
- Error diagnostics (no credential exposure)

### Elementor Status
- Elementor plugin detection
- Version retrieval
- Connected status (requires WordPress connection)

**TTL:** 60 seconds (cached status checks)

## Multi-Site Management

Both connectors support multiple sites per Business OS instance:

```typescript
// Register a site
elementorProvider.registerSite({
  siteId: "main",
  siteName: "Production",
  siteUrl: "https://yourdomain.com",
  username: "admin@domain.com",
  appPassword: "xxxx xxxx xxxx xxxx",
  enabled: true
});

// List all registered sites
const sites = elementorProvider.listSites();

// Get a specific site's client
const client = elementorProvider.getSite("main");
```

## Error Handling

API responses include detailed error information:

```json
{
  "error": "Forbidden",
  "detail": "Agent 'ResearchAgent' lacks permission 'elementor.pages.publish'"
}
```

Common errors:
- **403 Forbidden** — Permission denied (check RBAC)
- **404 Not Found** — Site or page not found
- **400 Bad Request** — Missing required parameters
- **500 Internal Server Error** — WordPress/Elementor API error (see logs)

## Configuration

### Environment Variables
```env
# WordPress connection
WORDPRESS_URL=https://yourdomain.com
WORDPRESS_USERNAME=your-email@example.com
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Optional: Override
WORDPRESS_TIMEOUT=30000  # milliseconds
```

### Runtime Configuration
```typescript
// In lib/elementor-provider.ts, edit DEFAULT_SITE_CONFIGS
const DEFAULT_SITE_CONFIGS: Record<string, ElementorSiteConfig> = {
  'main': {
    siteId: 'main',
    siteName: 'Production',
    siteUrl: process.env.WORDPRESS_URL || 'https://example.com',
    username: process.env.WORDPRESS_USERNAME || '',
    appPassword: process.env.WORDPRESS_APP_PASSWORD || '',
    enabled: true,
  }
};
```

## Troubleshooting

### Connection Failed
1. Verify `WORDPRESS_URL` is correct and accessible
2. Check Application Password is valid
3. Confirm username is correct
4. Run `npm run typecheck` to verify configuration

### Permission Denied
1. Check agent has required permission
2. Review audit logs for operation result
3. Verify agent is properly configured in provider

### Elementor Not Detected
1. Verify Elementor plugin installed & activated
2. Run `getElementorVersion` operation
3. Check WordPress connection works first
4. Verify plugin version 3.0+

### Page Not Found
1. Verify page ID is correct
2. Check page exists in WordPress
3. Ensure site ID is registered
4. Review audit logs for details

## Documentation

For detailed usage guides:
- **WordPress:** See [`docs/WORDPRESS_INTEGRATION.md`](./WORDPRESS_INTEGRATION.md)
- **Elementor:** See [`docs/ELEMENTOR_INTEGRATION.md`](./ELEMENTOR_INTEGRATION.md)

Both include:
- Setup instructions
- API examples
- Agent workflows
- Audit logging details
- Security information
- Troubleshooting guide
- Reference for all operations

## Architecture Notes

Both connectors follow the same pattern:

```
WordPressClient / ElementorClient
    ↓
    Uses WordPress REST API
    (HTTP Basic Auth)
    ↓
WordPressProvider / ElementorProvider
    ↓
    RBAC enforcement
    Multi-site management
    Audit logging
    ↓
/api/wordpress | /api/elementor
    ↓
    Agent operations
```

## Future Enhancements

Planned features:
- Direct widget/section modification (Elementor Pro)
- Template cloning
- Revision history access
- Export/import pages
- Real-time collaboration support
- Advanced permission levels
- Scheduled operations queue
