# WordPress Connector Integration

Business OS includes a production-ready WordPress connector for managing content across multiple WordPress websites.

## Quick Start

### 1. Generate WordPress Application Password

1. Log into WordPress Admin at your WordPress site
2. Go to: **Users → Your Profile**
3. Scroll to: **Application Passwords**
4. Enter: `Business OS` (or your preferred app name)
5. Click: **Create Application Password**
6. Copy the generated password (will appear as 16 characters with spaces)

### 2. Configure Business OS

Update `.env.local` in your Business OS directory:

```env
WORDPRESS_URL=https://yourdomain.com
WORDPRESS_USERNAME=your-wordpress-email@example.com
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 3. Restart Business OS

```bash
npm run dev
```

### 4. Verify Connection

Visit: `http://localhost:4100/connections`

Look for the **WordPress** card under **Content Management** → Should show **CONNECTED**

## Architecture

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **WordPress Client** | REST API communication | `lib/wordpress-client.ts` |
| **WordPress Provider** | Multi-site management & RBAC | `lib/wordpress-provider.ts` |
| **Connector Status** | Health checks | `lib/connectors/wordpress.ts` |
| **API Endpoints** | Business OS integration | `app/api/wordpress/route.ts` |

### Multi-Site Support

The WordPress connector supports connecting multiple WordPress websites to a single Business OS instance:

```typescript
// Each site is isolated
const site1 = wordPressProvider.getSite('travel-blog');
const site2 = wordPressProvider.getSite('ecommerce-site');

// Each site has its own credentials
// Each site has its own content
// Access is controlled per-site
```

## Usage

### API Operations

All WordPress operations go through the unified API endpoint at `/api/wordpress`:

```bash
curl -X POST http://localhost:4100/api/wordpress \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "listPosts",
    "siteId": "main-site",
    "agent": "ContentAgent",
    "params": { "per_page": 10 }
  }'
```

### Available Operations

#### Posts
- `listPosts` - List posts with pagination
- `getPost` - Get individual post
- `createPost` - Create draft post
- `updatePost` - Edit post
- `deletePost` - Delete/trash post
- `publishPost` - Publish post
- `schedulePost` - Schedule for future publication

#### Pages
- `listPages` - List pages
- `getPage` - Get page
- `createPage` - Create page
- `updatePage` - Edit page
- `deletePage` - Delete page

#### Media
- `listMedia` - List media files
- `getMedia` - Get media item
- `deleteMedia` - Delete media

#### Taxonomy
- `listCategories` - List categories
- `createCategory` - Create category
- `listTags` - List tags
- `createTag` - Create tag

#### Comments
- `listComments` - List comments
- `updateComment` - Moderate comment

#### Users
- `listUsers` - List WordPress users
- `getCurrentUser` - Get authenticated user

#### Abilities (WordPress 6.9+)
- `listAbilities` - Discover WordPress Abilities API

## Permissions (RBAC)

Business OS enforces role-based access control for WordPress operations:

### Permission Levels

| Permission | Read | Create | Edit | Publish | Delete |
|-----------|------|--------|------|---------|--------|
| `wordpress.read` | ✓ | | | | |
| `wordpress.content.create` | ✓ | ✓ | | | |
| `wordpress.content.edit` | ✓ | ✓ | ✓ | | |
| `wordpress.content.publish` | ✓ | ✓ | ✓ | ✓ | |
| `wordpress.content.delete` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `wordpress.admin` | ✓ | ✓ | ✓ | ✓ | ✓ |

### Default Agent Permissions

| Agent | Permissions |
|-------|-------------|
| GBrain | `wordpress.read` |
| ResearchAgent | `wordpress.read` |
| SEOAgent | `wordpress.read`, `wordpress.content.edit` |
| ContentAgent | `wordpress.read`, `wordpress.content.create`, `wordpress.content.edit` |
| MarketingAgent | `wordpress.read`, `wordpress.content.create`, `wordpress.content.edit` |
| PublishingAgent | `wordpress.content.publish` (all perms) |

## Security

### Credentials

- **Never use regular WordPress passwords** — Only use Application Passwords
- Application Passwords are revocable and can be limited to specific endpoints
- Credentials are stored in `.env.local` and **never committed** to version control
- Credentials never appear in logs, API responses, or audit trails

### HTTPS

- WordPress URL must use HTTPS for production
- HTTP is allowed only for local development (`localhost`)

### API Access

- All operations require proper authentication
- Audit logs record all operations for compliance
- Destructive operations (delete, publish) require explicit permission
- No credentials are exposed to agents — they operate through the connector

## Audit Logging

Every WordPress operation is logged:

```json
{
  "timestamp": 1693526400000,
  "actor": "ContentAgent",
  "siteId": "main-site",
  "operation": "createPost",
  "resourceType": "post",
  "resourceId": "42",
  "result": "success",
  "detail": null
}
```

Access the audit logs:

```typescript
const logs = wordPressProvider.getAuditLogs('main-site');
```

## Testing

Run the WordPress test suite:

```bash
npm test -- wordpress.test.ts
```

Test the connection:

```bash
bash scripts/test-wordpress-connection.sh
```

## Troubleshooting

### 401 Unauthorized

**Problem:** WordPress shows `Connection failed: HTTP 401`

**Solution:**
1. Verify username is correct (should be WordPress login email)
2. Verify Application Password is correct (not your WordPress password)
3. Regenerate Application Password:
   - WordPress Admin → Users → Profile → Application Passwords
   - Create new password for "Business OS"
   - Update `.env.local`
4. Restart Business OS dev server

### 403 Forbidden

**Problem:** WordPress shows `Insufficient permissions`

**Solution:**
1. Verify WordPress user has appropriate role (Editor or Administrator recommended)
2. Check WordPress user permissions: WordPress Admin → Users → Edit User
3. Ensure REST API is enabled for the user's role

### REST API Not Available

**Problem:** WordPress shows `REST API not available`

**Solution:**
1. Verify WordPress version (5.0+)
2. Check that REST API isn't disabled by plugin or theme
3. Verify URL is correct and accessible
4. Check for SSL/HTTPS issues

### WooCommerce Issues

**Problem:** WooCommerce operations not working

**Solution:**
1. Install WooCommerce plugin first
2. Create WooCommerce API credentials separately
3. WooCommerce support coming in next iteration

## Integration with GBrain

WordPress content can be indexed into Business OS's knowledge system:

```typescript
// Sync WordPress posts to GBrain
const posts = await client.listPosts({ per_page: 100 });
for (const post of posts.items) {
  await gBrain.ingest({
    source: 'wordpress',
    siteId: 'main-site',
    wordpressObjectId: post.id,
    title: post.title.rendered,
    content: post.content.rendered,
    permalink: post.link,
    lastModified: post.modified_gmt,
  });
}
```

## Advanced Usage

### Custom Permissions

Override default permissions for specific agents:

```typescript
const context: WordPressAgentContext = {
  agent: 'CustomAgent',
  permissions: ['wordpress.read', 'wordpress.content.create'],
  siteId: 'main-site',
};

const check = wordPressProvider.checkOperation(context, 'createPost', 'post');
```

### Direct Client Access

For advanced operations, access the WordPress client directly:

```typescript
const client = wordPressProvider.getSite('main-site');
const post = await client.getPost(42);
const updated = await client.updatePost(42, {
  content: { raw: 'New content' },
  status: 'draft',
});
```

### Audit Log Analysis

Retrieve audit logs for compliance:

```typescript
// Get all operations for a site
const allLogs = wordPressProvider.getAuditLogs('main-site');

// Get recent 50 operations
const recentLogs = wordPressProvider.getAuditLogs('main-site', 50);

// Filter by operation
const createOps = allLogs.filter(l => l.operation === 'createPost');
```

## Limitations & Future Work

### Current Limitations
- Media uploads not yet implemented (ready in architecture)
- WooCommerce support documented but not complete
- Webhook integration requires optional WordPress plugin

### Planned Enhancements
1. Media upload with security validation
2. WooCommerce product management
3. Webhook support for real-time sync
4. Advanced query filtering and search
5. Batch operations
6. Content scheduling with cron

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Run `bash scripts/test-wordpress-connection.sh` to verify connection
3. Review audit logs: `wordPressProvider.getAuditLogs()`
4. Check Business OS docs: `/Users/wrojas/AI/01-PROJECTS/Business OS/CLAUDE.md`
