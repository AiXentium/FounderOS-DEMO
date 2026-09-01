# Founder OS — Lovable Project Brief

## What this project is

Founder OS is a local-first business operating system for a founder, small agency, or multi-client marketing department. It combines an AI agent command center, business memory, website creation, affiliate marketing, social content operations, analytics, workflows, and external connections in one workspace.

The goal is to provide a reusable template. A founder should be able to create a new client or business workspace, answer a guided setup interview, generate a professional website and marketing plan, connect external platforms later, and keep the resulting work organized in shared memory.

## Primary product areas

### 1. Business Setup Agent

The setup agent is the first-run guide for the whole system. It should ask:

- What type of business or website is being created?
- Is this a new project, a transfer from an existing site, or a project based on a reference/template?
- What audience, offer, brand direction, competitors, pages, and business goals matter?
- Is there an existing website URL to analyze?
- What domain, hosting provider, and DNS provider will be used?

It should then create a saved project brief, recommend a site structure, generate initial website sections, and guide the user through content, assets, SEO, analytics, domain, hosting, DNS, and launch checks.

### 2. AI Website Builder

The builder should create distinctive, professional websites rather than generic landing pages. It needs:

- Design directions and visual system controls.
- AI-generated page briefs, copy, sections, CTAs, SEO content, and image prompts.
- Brand voice and design consistency.
- Website URL analysis and reference-site interpretation.
- Asset uploads for images, ZIP files, and other project files.
- Asset folders, previews, rename, delete, and safe ZIP extraction.
- Persistent projects with project switching and cloning.
- True drag-and-drop block editing.
- Responsive desktop/mobile previews.
- React and HTML export.
- Optional deployment to GitHub Pages, Vercel, Cloudflare Pages, or another host.
- Domain and DNS setup guidance with provider-specific records.

The existing design intelligence layer should remain part of the experience. It provides anti-generic design rules, style directions, and a taste audit.

### 3. Affiliate Studio

Affiliate Studio is the marketing department’s product and campaign workspace. It should:

- Import products from affiliate links or network APIs.
- Store product name, source, URL, tracked URL, price, commission, and status.
- Support multiple affiliate networks and multiple affiliate accounts.
- Include Viator alongside Amazon, Impact, CJ, ShareASale, ClickBank, Awin, Rakuten, and AliExpress.
- Generate tracked links and campaign-specific links.
- Create custom campaigns from one or more products.
- Generate channel-specific promotional copy.
- Queue content for social platforms.
- Sync clicks, conversions, commissions, and revenue when network credentials are connected.
- Feed product and campaign data into shared OS memory and analytics.

### 4. Social Marketing Department

The social workspace should support:

- Content calendars and post queues.
- Platform-specific content for Instagram, TikTok, LinkedIn, X, YouTube, Facebook, and other supported channels.
- Media attachment and asset reuse.
- Approval states and scheduled publishing.
- Real OAuth connections where required.
- A background publishing worker with retries, rate limits, and provider logs.
- Channel analytics and competitor research when data providers are connected.

### 5. AI provider system

AI providers should be configured from the Connections area. The system should support local and free/free-tier providers first, with automatic failover when a provider is unavailable or its quota is exhausted.

Supported connection slots include OpenRouter, Groq, Cerebras, Together AI, Mistral, DeepSeek, Fireworks, Ollama, and any custom OpenAI-compatible endpoint. Claude and ChatGPT subscription access should be treated separately from API access; the system should not pretend a consumer subscription is an API credential.

### 6. Agent command center

The OS includes a roster of specialized agents across engineering, design, marketing, finance, operations, research, and support. Agents should:

- Have clear roles, skills, and statuses.
- Receive context from the shared memory layer.
- Be assignable to workspaces, projects, campaigns, and tasks.
- Record runs, messages, outcomes, errors, and usage.
- Use the configured AI provider routing system.
- Run local workflows now and external actions only after the relevant connection is configured.

### 7. Shared memory and G-Brain

The shared context layer should connect business setup, website projects, products, campaigns, agents, tasks, and analytics. It should make relevant project information available to the AI agents without leaking credentials.

G-Brain/knowledge features should support notes, documents, searchable memory, relationships, and context-aware agent responses.

### 8. Connections

Connections are intentionally credential-gated. The UI should show what is available, what is configured, and what still needs an API key or OAuth approval. Categories include:

- Free API LLM
- Affiliate Networks
- Social and Marketing
- Communication
- CRM and Sales
- Productivity
- Storage
- Finance
- Hosting and Deployment

Each connection should have setup instructions, an official account link, required environment variables, connection testing, and a clear failure state.

## Reliability and safety requirements

- Never expose API keys in the browser, logs, exports, or shared memory.
- Validate all uploaded files and enforce size/type limits.
- Prevent path traversal and unsafe archive extraction.
- Use retries with exponential backoff for temporary provider failures.
- Track provider quota, latency, errors, and fallback events.
- Provide a local readiness/health report.
- Keep all external actions disabled until credentials and user approval exist.
- Back up project, campaign, and product data.
- Preserve demo mode when no credentials are configured.
- Use workspace and user permissions before multi-client production use.

## Current template behavior

The current template already includes the local-first dashboard, agent roster, shared context foundation, AI failover adapter, Free API LLM and affiliate connector categories, Viator connector listing, Affiliate Studio foundation, Website Builder MVP, design intelligence, local uploads, project persistence, export metadata, jobs queue, backup/restore endpoints, readiness endpoint, and automated tests.

The following still require implementation or external credentials: real affiliate-network imports, real commission syncing, live social publishing, OAuth, production authentication, multi-client permissions, true drag-and-drop editing, complete React/HTML export, deployment automation, screenshot analysis, Canva API, folders/ZIP extraction, production database migration, and scheduled workers.

## Lovable implementation expectations

Lovable should preserve the existing feature boundaries and improve them into production-quality flows. Do not replace the system with a generic marketing dashboard. Keep the Founder OS visual identity, navigation, shared memory model, local demo mode, and provider-agnostic architecture.

The best implementation sequence is:

1. Make setup create and switch persistent workspaces/projects.
2. Make Website Builder editing, assets, preview, and export complete.
3. Make Affiliate Studio network imports and campaign tracking complete.
4. Add the social publishing worker and OAuth connections.
5. Add authentication, multi-client permissions, jobs, observability, backups, and production deployment.

## Local development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

The development app uses port 4100. Copy `.env.example` to `.env.local` and add credentials only when testing external providers.
