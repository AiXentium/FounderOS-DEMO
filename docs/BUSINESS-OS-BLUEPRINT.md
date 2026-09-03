# Business OS Master Blueprint

**Purpose:** One governed operating system for Let’s Talk Miles & Travel and future businesses. Local and online deployments must run the same application source and schema. Live account data remains environment-specific and is never replaced with invented values.

## Operating model

G-Brain is the knowledge and orchestration layer. The Concierge is the interactive consultant for business setup, blueprint changes, and strategic recommendations. Conductor routes work to specialist agents. Specialists read the shared skill library and connected services, produce reviewable work, and record runs, tasks, failures, and learnings.

The default loop is:

1. Observe live connections, business data, calendar, content, and performance.
2. Research and propose a plan.
3. Assign work to specialist agents.
4. Draft content, pages, media, campaigns, and schedules.
5. Run compliance, brand, attribution, and quality checks.
6. Present a review queue.
7. Publish or modify external systems only after approval, unless a future trust rule explicitly authorizes that exact action.
8. Measure results and feed approved outcomes back into G-Brain memory.

## Shared product surfaces

- **Business Setup / Concierge:** business blueprint, goals, audience, brand, operating model, and recommendations.
- **Personas:** reusable business variants that configure priorities, pillars, connectors, metrics, and playbooks.
- **G-Brain:** shared knowledge, source documents, agent memory, and retrieval.
- **Org Chart:** agent hierarchy, departments, responsibilities, and live connector readiness.
- **Skills:** shared capability library available to every agent; status must distinguish live, learning, and planned.
- **Affiliate Studio:** live product discovery, source images/links, affiliate tracking, campaign drafts, and approval.
- **Content:** research briefs, blog drafts, social variants, media briefs, and monetization opportunities.
- **Website Builder:** WordPress/Elementor collaboration, page proposals, brand consistency, and approved changes.
- **Social:** connected account data, content queue, publishing through the approved social connector, and results.
- **Calendar:** live Google Calendar read path plus local planning drafts; write-back requires authorized Calendar API/OAuth scope.
- **Analytics:** connector-backed audience, revenue, pipeline, email, brain, and agent-run metrics; unavailable values remain pending.
- **Tasks:** planning and ownership queue.
- **Jobs:** execution ledger; never claim completion without a real executor.
- **Doctor:** dependency audit showing connector failures, unused optional services, agent runs, and knowledge health.
- **Connections:** one hub for MCP, API-key, OAuth, and provider-managed methods; one working method is sufficient.

## Agent team

### Command and business design

- **G-Brain / Concierge:** maintains the blueprint, identifies gaps, proposes new capabilities, and coordinates the team.
- **Conductor:** routes requests and assembles cross-functional work.
- **Business Strategist:** turns goals and persona context into measurable operating plans.
- **Research Analyst:** source-backed market, destination, seasonal, competitor, and trend research.

### Content monetization

- **Content Monetization Strategist:** maps each platform’s legitimate monetization options, eligibility, disclosures, audience fit, and revenue model.
- **SEO and Editorial Agent:** search-intent briefs, destination guides, affiliate roundups, internal links, and refresh plans.
- **Social Content Agent:** platform-native posts, hooks, carousels, reels, captions, and calls to action.
- **Email and Lifecycle Agent:** newsletters, nurture sequences, campaign calendars, and subscriber segmentation.
- **Affiliate Research Operator:** live Viator and approved affiliate-product research with source links, images, pricing, and commission context.
- **Analytics and Attribution Agent:** tracks reach, clicks, conversions, commissions, content performance, and next experiments.

### UGC and creative production

- **UGC Creative Director:** campaign concepts, briefs, scripts, shot lists, and creator direction.
- **Image and Location Analyst:** reviews uploaded images, identifies likely location/context, and proposes relevant campaigns.
- **Video Producer:** short-form scripts, edits, aspect-ratio variants, subtitles, and platform packaging.
- **Design and Brand Guardian:** logo, typography, color, imagery, voice, accessibility, claims, and consistency.
- **Creative QA Agent:** checks rights, resolution, dimensions, brand fit, disclosure placement, and factual claims.

### Website, distribution, and operations

- **Website Designer / WordPress Operator:** proposes page structures, content blocks, SEO fields, and safe WordPress/Elementor changes.
- **Social Publisher:** schedules approved content through Zernio or another verified connector.
- **Community and Engagement Agent:** manages approved replies, DMs, comments, and escalation.
- **Calendar and Campaign Coordinator:** converts approved plans into dates, reminders, and review milestones.
- **Finance and Commission Agent:** reconciles verified payouts and expenses, prepares tax categories, and flags items for professional review.
- **Compliance Agent:** affiliate disclosures, platform rules, copyright, privacy, and advertising claims.
- **Job Steward / Reliability Agent:** organizes execution records, detects missing executors, retries only under policy, and reports failures.

## Content-to-commission launch sequence

1. Use Concierge to choose a destination, audience, season, and revenue goal.
2. Research current travel demand, holidays, trends, products, and source imagery.
3. Select verified affiliate products and preserve the original source URL and image attribution.
4. Create one cornerstone website guide, supporting product sections, email content, and platform-specific social variants.
5. Run Brand, Compliance, Creative QA, and Attribution checks.
6. Review and approve drafts.
7. Schedule approved content through the connected social and calendar systems.
8. Monitor clicks, engagement, sales, commissions, and content-platform monetization eligibility.
9. Feed verified results into the next campaign brief.

## Connection policy

Every connector must expose its actual state: connected, not configured, or error. MCP, API, OAuth, and browser/provider-managed paths must be labeled. Secrets never enter Git, backups, browser logs, or blueprint files. Amazon SiteStripe/browser-assisted research must remain compliant with Amazon Associates rules and must not be represented as API automation without approved credentials.

## Local and online parity

- Source parity is enforced through the canonical Git repository and deployment commit.
- Schema and application changes are tested before deployment.
- Local databases and online runtime data are backed up separately; credentials are never copied between them automatically.
- After each release: build, inspect connector statuses, check Doctor, verify core pages, and confirm no demo fallback is displayed as live data.
- Recovery point created before this blueprint: `pre-blueprint-2026-09-03`.

## Definition of ready

The OS is ready for a business when the blueprint is approved, required connectors are live, every assigned agent has a defined skill path, content has a source and disclosure trail, Jobs can prove execution, Analytics can measure results, and the operator can approve or reject external actions.

## Immediate work queue

1. Confirm the business blueprint and brand brief.
2. Create the first Spain/coastal-family content campaign.
3. Verify Viator and Zernio data paths; connect Google Calendar write access only if desired.
4. Add approved monetization targets by platform.
5. Produce the first UGC image/video package.
6. Review and approve website and social drafts.
7. Run Doctor and Analytics after the first campaign cycle.
