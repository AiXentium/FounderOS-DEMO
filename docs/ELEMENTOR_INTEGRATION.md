# Elementor Connector Integration

Business OS includes an Elementor connector that lets agents manage Elementor-built pages alongside the WordPress connector. Full document editing requires the optional **Business OS Elementor Bridge** plugin on the WordPress site.

## What It Does

The Elementor Connector allows Business OS and its agents to:

- ✅ List all pages (Elementor and regular WordPress)
- ✅ Create new pages (ready for Elementor editing)
- ✅ Edit page properties (title, status, metadata)
- ✅ Publish pages programmatically
- ✅ Duplicate pages
- ✅ Delete pages
- ✅ Get edit URLs (to open in Elementor editor)
- ✅ Get preview URLs
- ✅ Detect which pages use Elementor
- ✅ Access Elementor templates
- ✅ Inspect the real nested Elementor document (sections, containers, columns, widgets, and settings)
- ✅ Apply bounded, capability-checked draft changes to Elementor sections and widgets

## Agent Permissions

**Default RBAC Configuration:**

| Agent | Permissions | Can Do |
|-------|-------------|--------|
| **GBrain** | `elementor.read`, `elementor.templates.access` | Read pages, access templates |
| **ResearchAgent** | `elementor.read` | Read-only access |
| **SEOAgent** | `elementor.read`, `elementor.pages.edit` | Read & edit metadata |
| **ContentAgent** | `elementor.read`, `elementor.pages.create`, `elementor.pages.edit` | Create, read, edit |
| **WebsiteBuilder** | `elementor.read`, `elementor.pages.create`, `elementor.pages.edit` | Create & edit pages |
| **MarketingAgent** | `elementor.read`, `elementor.pages.create`, `elementor.pages.edit` | Create & edit pages |
| **PublishingAgent** | `elementor.pages.publish` + all above | Create, edit, **publish** pages |

## Setup

### Prerequisites

1. WordPress site with Elementor installed
2. Same credentials as WordPress connector:
   ```env
   WORDPRESS_URL=https://yourdomain.com
   WORDPRESS_USERNAME=your-email@example.com
   WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
3. For live section/widget editing, install and activate `wordpress-plugin/business-os-bridge` from this repository. The plugin uses the same WordPress Application Password and does not weaken iframe security headers.

### Verification

The Elementor connector automatically:
1. Detects if Elementor is installed
2. Gets the Elementor version
3. Shows connection status in Business OS UI

Visit: `http://localhost:4100/connections`

Look for **Elementor** card under **Content Management** → Should show **CONNECTED**

The bridge itself can be checked at `GET /wp-json/business-os/v1/health`. The WordPress REST user must have `edit_pages` and `edit_post` for pages it edits; add `publish_pages` only for an account allowed to publish.

## Using the API

All Elementor operations go through `/api/elementor`:

### List All Pages

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "listPages",
    "siteId": "main",
    "agent": "ContentAgent",
    "params": { "per_page": 10 }
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "items": [
      {
        "id": 123,
        "title": "Home Page",
        "status": "publish",
        "link": "https://...",
        "editUrl": "https://.../wp-admin/post.php?post=123&action=elementor",
        "isBuiltWithElementor": true
      }
    ],
    "total": 42,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

### Create a New Page

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "createPage",
    "siteId": "main",
    "agent": "ContentAgent",
    "data": {
      "title": "New Landing Page",
      "status": "draft"
    }
  }'
```

### Get Edit URL

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "getEditUrl",
    "siteId": "main",
    "agent": "WebsiteBuilder",
    "params": { "id": 123 }
  }'
```

**Returns:** `https://example.com/wp-admin/post.php?post=123&action=elementor`

### Publish a Page

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "publishPage",
    "siteId": "main",
    "agent": "PublishingAgent",
    "params": { "id": 123 }
  }'
```

### Duplicate a Page

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "duplicatePage",
    "siteId": "main",
    "agent": "ContentAgent",
    "params": { "id": 456 }
  }'
```

## Elementor-Specific Operations

### Inspect the real Elementor document

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{"operation":"getElementorStructure","siteId":"main","agent":"WebsiteBuilder","params":{"id":123}}'
```

### Apply a safe draft edit

The bridge supports `replace_text`, `update_settings`, `insert_element`, `remove_element`, and `replace_document`. Business OS records the operation; publishing remains a separate approval-gated action.

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{"operation":"applyElementorChange","siteId":"main","agent":"WebsiteBuilder","params":{"id":123},"data":{"action":"replace_text","search":"Old headline","replace":"New headline","expected_count":1}}'
```

### Check if Elementor is Available

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "isElementorAvailable",
    "siteId": "main"
  }'
```

### Get Elementor Version

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "getElementorVersion",
    "siteId": "main"
  }'
```

### List Elementor Templates

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "listTemplates",
    "siteId": "main",
    "agent": "WebsiteBuilder"
  }'
```

### Check if Page Uses Elementor

```bash
curl -X POST http://localhost:4100/api/elementor \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "isPageBuiltWithElementor",
    "siteId": "main",
    "params": { "id": 789 }
  }'
```

## Agent Workflows

### Content Agent: Create and Edit

```typescript
// 1. Create draft
const page = await elementorClient.createPage({
  title: "Q4 Campaign Landing Page",
  status: "draft"
});

// 2. Get edit URL to hand to WebsiteBuilder agent
const editUrl = elementorClient.getEditUrl(page.id);

// 3. Update metadata
await elementorClient.updatePage(page.id, {
  title: "Q4 Campaign - Special Offer"
});
```

### Publishing Agent: Workflow

```typescript
// 1. Check page exists and is Elementor-built
const page = await elementorClient.getPage(pageId);
if (!page.isBuiltWithElementor) throw new Error("Not an Elementor page");

// 2. Publish
const published = await elementorClient.publishPage(pageId);
console.log(`Published: ${published.link}`);
```

### Website Builder Agent: Create and Design

```typescript
// 1. Create page
const page = await elementorClient.createPage({
  title: "New Service Page",
  status: "draft"
});

// 2. Get edit URL
const editUrl = elementorClient.getEditUrl(page.id);

// 3. Redirect agent/user to Elementor editor
// Elementor's visual builder handles the design
```

### GBrain: Index Elementor Pages

```typescript
// 1. List all Elementor pages
const pages = await elementorClient.listPages({
  elementorOnly: true,
  per_page: 100
});

// 2. Ingest into knowledge base
for (const page of pages.items) {
  await gBrain.ingest({
    source: "elementor",
    siteId: "main",
    pageId: page.id,
    title: page.title,
    url: page.link,
    lastModified: page.modified,
  });
}
```

## Audit Logging

Every operation is logged for compliance:

```json
{
  "timestamp": 1693526400000,
  "actor": "ContentAgent",
  "siteId": "main",
  "operation": "createPage",
  "pageId": "123",
  "pageName": "Campaign Page",
  "result": "success"
}
```

Access via:
```typescript
const logs = elementorProvider.getAuditLogs("main");
```

## Security

- ✅ RBAC prevents unauthorized operations
- ✅ No credentials exposed in API responses
- ✅ All operations audited
- ✅ Permission checks enforced before execution
- ✅ Access control denied operations logged

## Elementor + WordPress Integration

The Elementor Connector works **alongside** the WordPress Connector:

```
Business OS
  ├─ WordPress Connector (Posts, pages, media, taxonomy)
  └─ Elementor Connector (Elementor-built pages, templates, visual editing)
```

Both use the same WordPress site and credentials. Use them together:

```typescript
// WordPress: List all posts
const posts = await wordpressClient.listPosts();

// Elementor: List pages built with Elementor
const elementorPages = await elementorClient.listPages({ elementorOnly: true });

// Combine for complete content inventory
const contentMap = {
  posts: posts.items,
  elementorPages: elementorPages.items
};
```

## Limitations & Future

### Current
- Elementor page content editing happens in Elementor UI (not API)
- Templates are read-only (for discovery)

### Planned
- Direct widget/section modification API
- Template cloning
- Revision history access
- Export/import pages
- Elementor Pro-specific features

## Troubleshooting

### Elementor Not Detected
- Verify Elementor plugin is installed and activated
- Check plugin version (3.0+)
- Run: `getElementorVersion` operation

### Permission Denied
- Check agent has correct permission level
- Review audit logs for denial reason
- Contact admin for permission upgrade

### Pages Not Listed
- Verify WordPress connection works
- Check page query parameters (status, per_page)
- Ensure pages exist in WordPress

## Reference

### Available Operations
- `listPages` - List pages with Elementor detection
- `getPage` - Get single page details
- `createPage` - Create new page
- `updatePage` - Edit page metadata
- `publishPage` - Publish to production
- `deletePage` - Trash or permanently delete
- `duplicatePage` - Clone a page
- `getPageMetadata` - Get title, author, date
- `getEditUrl` - Get Elementor editor link
- `getPreviewUrl` - Get live preview link
- `isElementorAvailable` - Check plugin status
- `getElementorVersion` - Get version string
- `listTemplates` - Access template library
- `isPageBuiltWithElementor` - Detect builder
- `getElementorPageData` - Get raw page structure

### Required Environment Variables
```env
WORDPRESS_URL=https://yourdomain.com
WORDPRESS_USERNAME=your-email@example.com
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### API Endpoint
- **POST** `/api/elementor` - Execute operations
- **GET** `/api/elementor?operation=X&siteId=Y` - Query operations
