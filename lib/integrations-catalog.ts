import type { ConnectorStatus } from '@/lib/connectors/types';
import {
  INTEGRATION_CATEGORIES,
  type Integration,
  type IntegrationCategory,
} from '@/lib/schemas';

/**
 * The connections marketplace catalog. Larp-first: a rich, honest catalog of
 * popular tools. `connectorId` ties an entry to a real connector so its live
 * "connected" state is never faked; everything else reads as "not connected"
 * with a Connect affordance. Logos resolve from `slug` via lib/brand-logos
 * (simple-icons + a few hand-authored marks + intentional lettermarks).
 */
export const INTEGRATIONS: Integration[] = [
  // Communication
  { slug: 'slack', name: 'Slack', tagline: 'Channels & DMs', category: 'Communication', connectorId: 'slack', popular: true, envKeys: ['SLACK_BOT_TOKEN'] },
  { slug: 'gmail', name: 'Gmail', tagline: 'Send & read email', category: 'Communication', connectorId: 'email', popular: true, envKeys: [] },
  { slug: 'whatsapp', name: 'WhatsApp', tagline: 'Messages & broadcasts', category: 'Communication', connectorId: 'whatsapp', envKeys: [] },
  { slug: 'discord', name: 'Discord', tagline: 'Servers & channels', category: 'Communication' },
  { slug: 'telegram', name: 'Telegram', tagline: 'Chats & bots', category: 'Communication' },
  { slug: 'zoom', name: 'Zoom', tagline: 'Meetings & recordings', category: 'Communication', popular: true },
  { slug: 'manychat', name: 'ManyChat', tagline: 'IG DM automation', category: 'Communication', connectorId: 'manychat', envKeys: ['MANYCHAT_API_KEY'] },

  // Productivity
  { slug: 'notion', name: 'Notion', tagline: 'Docs & databases', category: 'Productivity', connectorId: 'notion', popular: true, envKeys: ['NOTION_API_KEY'] },
  { slug: 'airtable', name: 'Airtable', tagline: 'Bases & records', category: 'Productivity', popular: true },
  { slug: 'googlesheets', name: 'Google Sheets', tagline: 'Read & write spreadsheets', category: 'Productivity' },
  { slug: 'googledocs', name: 'Google Docs', tagline: 'Create & edit documents', category: 'Productivity' },
  { slug: 'clickup', name: 'ClickUp', tagline: 'Docs, tasks & goals', category: 'Productivity' },
  { slug: 'trello', name: 'Trello', tagline: 'Boards & cards', category: 'Productivity' },
  { slug: 'coda', name: 'Coda', tagline: 'Docs that act like apps', category: 'Productivity' },

  // CRM & Sales
  { slug: 'hubspot', name: 'HubSpot', tagline: 'Contacts & deals', category: 'CRM & Sales', popular: true },
  { slug: 'salesforce', name: 'Salesforce', tagline: 'Accounts & pipeline', category: 'CRM & Sales' },
  { slug: 'attio', name: 'Attio', tagline: 'CRM built on data', category: 'CRM & Sales', connectorId: 'attio', envKeys: ['ATTIO_API_KEY'] },
  { slug: 'zendesk', name: 'Zendesk', tagline: 'Tickets & support', category: 'CRM & Sales' },
  { slug: 'intercom', name: 'Intercom', tagline: 'Chat & lifecycle', category: 'CRM & Sales' },
  { slug: 'gohighlevel', name: 'GoHighLevel', tagline: 'LC pipeline & contacts', category: 'CRM & Sales', connectorId: 'ghl', envKeys: ['GHL_API_KEY', 'GHL_LOCATION_ID'] },

  // Developer
  { slug: 'github', name: 'GitHub', tagline: 'Repos, issues & PRs', category: 'Developer', popular: true },
  { slug: 'linear', name: 'Linear', tagline: 'Issues & projects', category: 'Developer' },
  { slug: 'jira', name: 'Jira', tagline: 'Boards & tickets', category: 'Developer' },
  { slug: 'vercel', name: 'Vercel', tagline: 'Deploys & logs', category: 'Developer' },
  { slug: 'sentry', name: 'Sentry', tagline: 'Errors & traces', category: 'Developer' },
  { slug: 'gitlab', name: 'GitLab', tagline: 'Repos & pipelines', category: 'Developer' },

  // Scheduling
  { slug: 'googlecalendar', name: 'Google Calendar', tagline: 'Events & availability', category: 'Scheduling', connectorId: 'calendar', popular: true, envKeys: [] },
  { slug: 'calendly', name: 'Calendly', tagline: 'Booking links', category: 'Scheduling' },
  { slug: 'caldotcom', name: 'Cal.com', tagline: 'Open scheduling', category: 'Scheduling' },
  { slug: 'googlemeet', name: 'Google Meet', tagline: 'Video calls', category: 'Scheduling' },

  // Finance
  { slug: 'stripe', name: 'Stripe', tagline: 'Payments & invoices', category: 'Finance', connectorId: 'payments', popular: true, envKeys: ['STRIPE_SECRET_KEY'] },
  { slug: 'quickbooks', name: 'QuickBooks', tagline: 'Bookkeeping & P&L', category: 'Finance' },
  { slug: 'xero', name: 'Xero', tagline: 'Accounting & bills', category: 'Finance' },
  { slug: 'paypal', name: 'PayPal', tagline: 'Payments & payouts', category: 'Finance', envKeys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'] },
  { slug: 'wise', name: 'Wise', tagline: 'Multi-currency balances', category: 'Finance' },
  { slug: 'plaid', name: 'Plaid', tagline: 'Bank connections', category: 'Finance' },

  // Marketing
  { slug: 'mailchimp', name: 'Mailchimp', tagline: 'Email campaigns', category: 'Marketing' },
  { slug: 'googleanalytics', name: 'Google Analytics', tagline: 'Traffic & conversions', category: 'Marketing' },
  { slug: 'meta', name: 'Meta Ads', tagline: 'Campaigns & audiences', category: 'Marketing', connectorId: 'meta-ads', envKeys: ['META_ADS_ACCESS_TOKEN'] },
  { slug: 'beehiiv', name: 'beehiiv', tagline: 'Newsletter & subscribers', category: 'Marketing', connectorId: 'beehiiv', envKeys: ['BEEHIIV_API_KEY'] },
  { slug: 'buffer', name: 'Buffer', tagline: 'Schedule social posts', category: 'Marketing' },
  { slug: 'hootsuite', name: 'Hootsuite', tagline: 'Social management', category: 'Marketing' },
  { slug: 'zernio', name: 'Zernio', tagline: 'Cross-platform posting', category: 'Marketing', connectorId: 'zernio', envKeys: ['ZERNIO_API_KEY'] },
  { slug: 'webinarjam', name: 'WebinarJam', tagline: 'Webinar registrants', category: 'Marketing', connectorId: 'webinarjam', envKeys: ['WEBINARJAM_API_KEY'] },
  { slug: 'trakyo', name: 'Trakyo', tagline: 'Organic attribution', category: 'Marketing', connectorId: 'trakyo', envKeys: ['TRAKYO_API_KEY'] },

  // Storage
  { slug: 'googledrive', name: 'Google Drive', tagline: 'Files & folders', category: 'Storage' },
  { slug: 'dropbox', name: 'Dropbox', tagline: 'Sync & share', category: 'Storage' },
  { slug: 'box', name: 'Box', tagline: 'Content cloud', category: 'Storage' },
  { slug: 'onedrive', name: 'OneDrive', tagline: 'Microsoft files', category: 'Storage' },
  { slug: 'obsidian', name: 'Notes', tagline: 'Markdown vault', category: 'Storage', connectorId: 'obsidian', envKeys: [] },

  // AI & Automation
  { slug: 'openai', name: 'OpenAI', tagline: 'GPT models & embeddings', category: 'AI & Automation', envKeys: ['OPENAI_API_KEY', 'AI_GATEWAY_API_KEY'] },
  { slug: 'anthropic', name: 'Anthropic', tagline: 'Claude models', category: 'AI & Automation', popular: true, envKeys: ['AI_GATEWAY_API_KEY'] },
  { slug: 'zapier', name: 'Zapier', tagline: 'Automate anything', category: 'AI & Automation' },
  { slug: 'make', name: 'Make', tagline: 'Visual workflows', category: 'AI & Automation' },
  { slug: 'n8n', name: 'n8n', tagline: 'Self-hosted automation', category: 'AI & Automation' },

  // Free / free-tier LLM providers. These use the common key panel and the
  // failover runtime; no provider is required for demo mode.
  { slug: 'openrouter', name: 'OpenRouter', tagline: 'Free and multi-model routing', category: 'FREE API LLM', envKeys: ['OPENROUTER_API_KEY'], popular: true, externalUrl: 'https://openrouter.ai/keys' },
  { slug: 'groq', name: 'Groq', tagline: 'Fast free-tier inference', category: 'FREE API LLM', envKeys: ['GROQ_API_KEY'], externalUrl: 'https://console.groq.com/keys' },
  { slug: 'cerebras', name: 'Cerebras', tagline: 'Fast open-model inference', category: 'FREE API LLM', envKeys: ['CEREBRAS_API_KEY'], externalUrl: 'https://cloud.cerebras.ai/' },
  { slug: 'together', name: 'Together AI', tagline: 'Open models API', category: 'FREE API LLM', envKeys: ['TOGETHER_API_KEY'], externalUrl: 'https://api.together.ai/settings/api-keys' },
  { slug: 'mistral', name: 'Mistral', tagline: 'Open and hosted models', category: 'FREE API LLM', envKeys: ['MISTRAL_API_KEY'], externalUrl: 'https://console.mistral.ai/api-keys/' },
  { slug: 'deepseek', name: 'DeepSeek', tagline: 'Reasoning and chat models', category: 'FREE API LLM', envKeys: ['DEEPSEEK_API_KEY'], externalUrl: 'https://platform.deepseek.com/api_keys' },
  { slug: 'fireworks', name: 'Fireworks', tagline: 'Open-model inference', category: 'FREE API LLM', envKeys: ['FIREWORKS_API_KEY'], externalUrl: 'https://fireworks.ai/account/api-keys' },
  { slug: 'ollama', name: 'Ollama', tagline: 'Free local models', category: 'FREE API LLM', envKeys: ['OLLAMA_BASE_URL'], externalUrl: 'https://ollama.com/download' },
  { slug: 'omniroute', name: 'OmniRoute', tagline: 'OpenAI-compatible multi-provider gateway', category: 'FREE API LLM', envKeys: ['OMNIROUTE_BASE_URL', 'OMNIROUTE_API_KEY'], externalUrl: 'https://github.com/AiXentium/OmniRoute' },
  { slug: 'custom-ai', name: 'Custom OpenAI-compatible', tagline: 'FreeLLM, LM Studio, or any endpoint', category: 'FREE API LLM', envKeys: ['AI_BASE_URL', 'AI_API_KEY'], externalUrl: 'https://lmstudio.ai/' },

  // Affiliate networks: credentials are optional until the operator is ready
  // to activate live product feeds and commission reporting.
  { slug: 'amazon-associates', name: 'Amazon Associates', tagline: 'Amazon products and commissions', category: 'AFFILIATE NETWORKS', envKeys: ['AMAZON_ASSOCIATE_TAG', 'AMAZON_PA_API_KEY'], popular: true, externalUrl: 'https://affiliate-program.amazon.com/' },
  { slug: 'impact', name: 'Impact', tagline: 'Partner programs and product feeds', category: 'AFFILIATE NETWORKS', envKeys: ['IMPACT_ACCOUNT_ID', 'IMPACT_API_KEY'], externalUrl: 'https://app.impact.com/' },
  { slug: 'cj-affiliate', name: 'CJ Affiliate', tagline: 'Advertisers, deep links, and feeds', category: 'AFFILIATE NETWORKS', envKeys: ['CJ_API_KEY', 'CJ_WEBSITE_ID'], externalUrl: 'https://www.cj.com/' },
  { slug: 'shareasale', name: 'ShareASale', tagline: 'Merchant offers and tracking', category: 'AFFILIATE NETWORKS', envKeys: ['SHAREASALE_API_TOKEN'], externalUrl: 'https://www.shareasale.com/' },
  { slug: 'clickbank', name: 'ClickBank', tagline: 'Digital offers and marketplace', category: 'AFFILIATE NETWORKS', envKeys: ['CLICKBANK_API_KEY'], externalUrl: 'https://www.clickbank.com/' },
  { slug: 'awin', name: 'Awin', tagline: 'Global partner network', category: 'AFFILIATE NETWORKS', envKeys: ['AWIN_API_TOKEN', 'AWIN_PUBLISHER_ID'], externalUrl: 'https://www.awin.com/' },
  { slug: 'rakuten-advertising', name: 'Rakuten Advertising', tagline: 'Retail partner programs', category: 'AFFILIATE NETWORKS', envKeys: ['RAKUTEN_API_KEY'], externalUrl: 'https://rakutenadvertising.com/' },
  { slug: 'aliexpress-affiliate', name: 'AliExpress Portals', tagline: 'Marketplace product links', category: 'AFFILIATE NETWORKS', envKeys: ['ALIEXPRESS_API_KEY'], externalUrl: 'https://portals.aliexpress.com/' },
  { slug: 'viator', name: 'Viator', tagline: 'Tours, activities, and travel experiences', category: 'AFFILIATE NETWORKS', connectorId: 'viator', envKeys: ['VIATOR_API_KEY', 'VIATOR_PARTNER_ID'], externalUrl: 'https://partnerresources.viator.com/' },

  // Content Management
  { slug: 'wordpress', name: 'WordPress', tagline: 'Posts, pages & content', category: 'Content Management', connectorId: 'wordpress', popular: true, envKeys: ['WORDPRESS_URL', 'WORDPRESS_USERNAME', 'WORDPRESS_APP_PASSWORD'] },
  { slug: 'elementor', name: 'Elementor', tagline: 'Visual page builder & design', category: 'Content Management', connectorId: 'elementor', popular: true, envKeys: ['WORDPRESS_URL', 'WORDPRESS_USERNAME', 'WORDPRESS_APP_PASSWORD'] },
  { slug: 'webflow', name: 'Webflow', tagline: 'No-code site builder & hosting', category: 'Content Management', envKeys: ['WEBFLOW_API_TOKEN'] },

  // Creative
  { slug: 'figma', name: 'Figma', tagline: 'Design & prototypes', category: 'Creative', popular: true },
  { slug: 'canva', name: 'Canva', tagline: 'Templates & graphics', category: 'Creative' },
  { slug: 'miro', name: 'Miro', tagline: 'Whiteboards & maps', category: 'Creative', connectorId: 'miro', envKeys: ['MIRO_ACCESS_TOKEN'] },
  { slug: 'loom', name: 'Loom', tagline: 'Screen recordings', category: 'Creative' },
  { slug: 'typeform', name: 'Typeform', tagline: 'Forms & surveys', category: 'Creative' },
  { slug: 'arcads', name: 'Arcads', tagline: 'AI video ads', category: 'Creative', connectorId: 'arcads', envKeys: ['ARCADS_BASIC_AUTH'] },
];

export type CatalogEntry = Integration & { connected: boolean; keySaved: boolean };

/** The env var names the connect flow may write for an entry. Explicit
 *  envKeys win; no envKeys = a generic <SLUG>_API_KEY; [] = guidance only
 *  (the tool connects through something other than a pasted key). */
export function connectKeysFor(entry: Integration): string[] {
  if (entry.envKeys) return entry.envKeys;
  return [`${entry.slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`];
}

/** Merge live connector state onto the catalog. `connected` is true only when a
 *  linked connector actually reports 'connected' — never faked. `keySaved`
 *  means every connect-flow key for the entry sits in .env.local (pass a fresh
 *  readEnvLocal()); a saved key on a connector-less tile shows as stored, not
 *  connected. */
export function connectionCatalog(
  statuses: ConnectorStatus[],
  savedEnv: Record<string, string> = {},
): CatalogEntry[] {
  const byId = new Map(statuses.map((s) => [s.id, s]));
  return INTEGRATIONS.map((i) => {
    const keys = connectKeysFor(i);
    return {
      ...i,
      connected: i.connectorId ? byId.get(i.connectorId)?.state === 'connected' : false,
      keySaved: keys.length > 0 && keys.every((k) => Boolean(savedEnv[k])),
    };
  });
}

/** Catalog grouped by category, in the canonical category order, skipping any
 *  category with no tools. */
export function integrationsByCategory(
  entries: Integration[] = INTEGRATIONS,
): Map<IntegrationCategory, Integration[]> {
  const out = new Map<IntegrationCategory, Integration[]>();
  for (const cat of INTEGRATION_CATEGORIES) {
    const tools = entries.filter((i) => i.category === cat);
    if (tools.length) out.set(cat, tools);
  }
  return out;
}
