# Business OS v2 Master Execution Backlog

This is the canonical execution backlog. The prior audit, gap analysis, implementation backlog, release checklist, and roadmap remain historical reference only. Travel Commerce OS remains paused until GA.

## Milestones

- **Epic 0 — Business OS v2 Modernization:** migrate the runtime and persistence foundation before platform features.
- **Business OS v2.0 Alpha:** secure foundation and core contracts.
- **Business OS v2.0 Beta:** complete local product workflows and reliable execution.
- **Business OS v2.0 RC:** integrations, operational hardening, and release validation.
- **Business OS v2.0 GA:** production deployment, recovery, documentation, and final release gate.

## Backlog

## Epic 0 — Business OS v2 Modernization

### BO-000A — Upgrade Next.js 14 → Next.js 15
- **Category:** Platform
- **Description:** Upgrade the framework and preserve current routes and runtime behavior.
- **Priority:** CRITICAL
- **Status:** COMPLETE
- **Dependencies:** None
- **Estimated Effort:** 3 days
- **Files Affected:** `package.json`, lockfile, `next.config.mjs`, `app/`, `tests/`
- **Acceptance Criteria:** Next.js 15 installed; build, TypeScript, tests, route smoke checks, and the documented quality gate pass. Completed with `eslint.config.mjs`, `QUALITY_GATE.md`, and `scripts/verify.ts`.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000B — Upgrade React 18 → React 19
- **Category:** Platform
- **Description:** Upgrade React and React DOM with compatibility fixes.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-000A
- **Estimated Effort:** 3 days
- **Files Affected:** `package.json`, lockfile, `app/`, `components/`, `tests/`
- **Acceptance Criteria:** React 19 installed; build, TypeScript, tests, and browser smoke checks pass.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000C — Introduce pnpm workspace compatibility
- **Category:** Platform
- **Description:** Make clean installation and scripts reproducible through pnpm workspace conventions.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-000A, BO-000B
- **Estimated Effort:** 2 days
- **Files Affected:** `pnpm-workspace.yaml`, `package.json`, lockfile, CI files, `README.md`
- **Acceptance Criteria:** Clean pnpm install and package scripts work; workspace metadata is documented.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000D — Introduce Prisma alongside the existing repository layer
- **Category:** Database
- **Description:** Add Prisma schema/client and a compatibility layer without removing SQLite.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-000C
- **Estimated Effort:** 7 days
- **Files Affected:** `prisma/`, `lib/repositories/`, `lib/db.ts`, `lib/data.ts`, `tests/`
- **Acceptance Criteria:** Prisma initializes safely; compatibility repositories use SQLite; existing workflows remain green.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000E — Introduce PostgreSQL support
- **Category:** Database
- **Description:** Add PostgreSQL configuration and adapter while SQLite and PostgreSQL run in parallel.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-000D
- **Estimated Effort:** 7 days
- **Files Affected:** `prisma/`, `lib/repositories/`, `.env.example`, deployment files, `tests/`
- **Acceptance Criteria:** PostgreSQL starts and migrates from documented configuration; both adapters share contracts.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000F — Convert repository implementations one at a time
- **Category:** Repositories
- **Description:** Migrate repositories incrementally through the compatibility layer.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-000E
- **Estimated Effort:** 15 days
- **Files Affected:** `lib/repositories/`, `lib/db.ts`, `lib/data.ts`, domain modules, `tests/`
- **Acceptance Criteria:** Each converted repository has focused SQLite/PostgreSQL parity tests; routes do not access databases directly.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000G — Migrate seed system
- **Category:** Database
- **Description:** Make seeds target the repository compatibility layer for both databases.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-000F
- **Estimated Effort:** 5 days
- **Files Affected:** `lib/seed.ts`, `scripts/seed.ts`, `prisma/`, `tests/`
- **Acceptance Criteria:** Fresh SQLite and PostgreSQL seeds are idempotent and produce matching entity counts.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000H — Run SQLite/PostgreSQL parity validation
- **Category:** Testing
- **Description:** Compare row counts, business logic, reports, and repository behavior.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-000G
- **Estimated Effort:** 8 days
- **Files Affected:** `tests/`, `scripts/`, `docs/DATABASE.md`, `docs/`
- **Acceptance Criteria:** Automated parity report covers all four comparison areas and all differences are resolved or approved.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-000I — Remove SQLite as the primary persistence layer
- **Category:** Database
- **Description:** Make PostgreSQL the production default only after parity is confirmed; retain SQLite for local/demo compatibility.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-000H
- **Estimated Effort:** 5 days
- **Files Affected:** `lib/data.ts`, `lib/db.ts`, `prisma/`, `.env.example`, `README.md`, `tests/`
- **Acceptance Criteria:** Production defaults to PostgreSQL; SQLite is not primary; migration and rollback guidance exists; build/tests pass.
- **Milestone:** Epic 0 — Business OS v2 Modernization

### BO-001 — Define canonical domain and module boundaries

- **Category:** Architecture
- **Description:** Establish ownership for platform, workspace, AI, CRM, finance, communications, marketing, analytics, connector, and deployment domains; record the canonical contracts.
- **Priority:** CRITICAL
- **Status:** COMPLETE
- **Dependencies:** None
- **Estimated Effort:** 3 days
- **Files Affected:** `docs/`, `lib/`, `app/`, `BUSINESS_OS_MASTER_BACKLOG.md`
- **Acceptance Criteria:** Domain ownership and public contracts are documented; no duplicate backlog scope remains; TypeScript passes. Completed in `docs/DOMAIN_BOUNDARIES.md` with `tests/domain-boundaries.test.ts`.
- **Milestone:** Business OS v2.0 Alpha

### BO-002 — Introduce versioned production database migrations

- **Category:** Database
- **Description:** Replace initialization-only schema setup with ordered, repeatable migrations and a production database adapter contract.
- **Priority:** CRITICAL
- **Status:** COMPLETE
- **Dependencies:** BO-001
- **Estimated Effort:** 7 days
- **Files Affected:** `lib/db.ts`, `lib/data.ts`, `scripts/`, `migrations/`, `package.json`
- **Acceptance Criteria:** A clean database migrates forward deterministically; repeated migration is safe; rollback/recovery procedure is documented; tests pass. Completed with `migrations/001_schema_tracking.sql`, `lib/migrations.ts`, and `scripts/migrate.ts`; clean and existing database runs passed.
- **Milestone:** Business OS v2.0 Alpha

### BO-003 — Implement users, sessions, and authentication

- **Category:** Authentication
- **Description:** Add user identity, login/logout, secure sessions, session revocation, and account lifecycle.
- **Priority:** CRITICAL
- **Status:** BLOCKED
- **Dependencies:** BO-000A COMPLETE, BO-000B COMPLETE, BO-000C COMPLETE, BO-000D COMPLETE, BO-000E COMPLETE, BO-000F COMPLETE, BO-000G COMPLETE, BO-000H COMPLETE, BO-000I COMPLETE
- **Estimated Effort:** 10 days
- **Files Affected:** `app/`, `lib/auth/`, `middleware.ts`, `lib/db.ts`, `tests/`
- **Acceptance Criteria:** Unauthenticated requests cannot access protected data; sessions can be revoked; login/logout and expiry tests pass; secrets are never logged. Blocked because the repository is currently Next.js 14/React 18/SQLite and does not contain the required Next.js 15/React 19/Prisma/PostgreSQL/Auth.js stack.
- **Milestone:** Business OS v2.0 Alpha

### BO-004 — Implement organizations, workspaces, roles, and permissions

- **Category:** Organizations
- **Description:** Turn organizations and workspaces into enforced tenant boundaries with role and permission policies.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-003
- **Estimated Effort:** 10 days
- **Files Affected:** `lib/db.ts`, `lib/policies/`, `app/api/`, `components/WorkspaceSwitcher.tsx`, `tests/`
- **Acceptance Criteria:** Every protected record is tenant-scoped; role/permission matrix is documented and tested; unauthorized reads and writes return consistent errors.
- **Milestone:** Business OS v2.0 Alpha

### BO-005 — Add configuration, feature flags, and centralized error contracts

- **Category:** Platform
- **Description:** Centralize runtime configuration, add persisted feature flags, and standardize API error codes and recovery responses.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-001, BO-002, BO-004
- **Estimated Effort:** 5 days
- **Files Affected:** `lib/config.ts`, `lib/errors.ts`, `app/api/`, `lib/db.ts`, `tests/`
- **Acceptance Criteria:** Invalid configuration fails clearly; flags can be safely read by server and UI; all mutation APIs use the shared error shape; tests pass.
- **Milestone:** Business OS v2.0 Alpha

### BO-006 — Create repository and API service boundaries

- **Category:** Repositories
- **Description:** Separate persistence repositories and application services from route handlers for all core domains.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-001, BO-002, BO-005
- **Estimated Effort:** 10 days
- **Files Affected:** `lib/repositories/`, `lib/services/`, `app/api/`, `tests/`
- **Acceptance Criteria:** Routes validate and delegate; repositories own persistence; core domains have unit tests without HTTP bootstrapping; TypeScript passes.
- **Milestone:** Business OS v2.0 Alpha

### BO-007 — Add structured logging, audit events, metrics, and tracing hooks

- **Category:** Observability
- **Description:** Add correlation IDs, structured server logs, durable audit events, and instrumentation hooks for requests, jobs, and connector calls.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-003, BO-004, BO-006
- **Estimated Effort:** 8 days
- **Files Affected:** `lib/observability/`, `middleware.ts`, `app/api/`, `lib/db.ts`, `tests/`
- **Acceptance Criteria:** Requests and mutations emit correlated structured events; sensitive values are redacted; audit records identify actor, tenant, action, and result.
- **Milestone:** Business OS v2.0 Alpha

### BO-008 — Implement security baseline and abuse controls

- **Category:** Security
- **Description:** Add security headers, origin/CSRF protections, rate limiting, input/file threat controls, secret redaction, and dependency/security checks.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-003, BO-004, BO-007
- **Estimated Effort:** 8 days
- **Files Affected:** `middleware.ts`, `app/api/`, `lib/security/`, `next.config.mjs`, `tests/`
- **Acceptance Criteria:** Protected mutations enforce origin/session controls; rate limits are measurable; uploads reject unsafe content; security tests pass.
- **Milestone:** Business OS v2.0 Alpha

### BO-009 — Complete durable storage and asset management

- **Category:** Storage
- **Description:** Add storage abstraction, durable asset metadata, folder browsing, ZIP contents, bulk actions, and production object-storage compatibility.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-002, BO-004, BO-008
- **Estimated Effort:** 8 days
- **Files Affected:** `lib/assets.ts`, `app/api/assets/`, `components/WebsiteBuilderTools.tsx`, `tests/`
- **Acceptance Criteria:** Assets survive restart; nested ZIP files are safe and addressable; folders, previews, rename, delete, and bulk operations work; limits are enforced.
- **Milestone:** Business OS v2.0 Beta

### BO-010 — Build durable queue, worker, scheduler, retry, and quota runtime

- **Category:** Platform
- **Description:** Replace local-only queue behavior with durable job execution, scheduling, retries, idempotency, dead-letter handling, and provider quota tracking.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-002, BO-006, BO-007, BO-008
- **Estimated Effort:** 15 days
- **Files Affected:** `lib/jobs/`, `app/api/jobs/`, `scripts/`, `lib/db.ts`, `tests/`
- **Acceptance Criteria:** Jobs execute after restart; retries are bounded and idempotent; failed jobs are inspectable; scheduled jobs run; quota usage is recorded.
- **Milestone:** Business OS v2.0 Beta

### BO-011 — Complete shared project memory and knowledge context

- **Category:** Memory
- **Description:** Connect setup, website, affiliate, social, agents, and jobs to one tenant/project-scoped memory and knowledge context.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-004, BO-006, BO-009
- **Estimated Effort:** 8 days
- **Files Affected:** `lib/system-context.ts`, `lib/brain*`, `app/api/brain/`, `app/api/setup/`, `tests/`
- **Acceptance Criteria:** A project context can be created, queried, updated, and used by each core workspace; context is tenant-scoped; restart tests pass.
- **Milestone:** Business OS v2.0 Beta

### BO-012 — Add agent-to-project assignment and durable planning

- **Category:** AI Runtime
- **Description:** Assign agents and skills to projects, persist plans and task state, and support approvals, recovery, and result history.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-010, BO-011
- **Estimated Effort:** 10 days
- **Files Affected:** `lib/agents/`, `app/api/agents/`, `app/api/projects/agents/`, `app/agents/`, `tests/`
- **Acceptance Criteria:** Agents can be assigned/unassigned; plans and results survive restart; jobs show owner/project/status; failure recovery is tested.
- **Milestone:** Business OS v2.0 Beta

### BO-013 — Finish Website Builder visual editor and responsive canvas

- **Category:** UI
- **Description:** Complete section-level editing for text, images, links, colors, spacing, and responsive desktop/tablet/mobile previews.
- **Priority:** HIGH
- **Status:** IN PROGRESS
- **Dependencies:** BO-009, BO-011
- **Estimated Effort:** 12 days
- **Files Affected:** `app/website-builder/`, `components/WebsiteBuilderTools.tsx`, `components/SectionInspector.tsx`, `app/api/website/`, `tests/`
- **Acceptance Criteria:** Every editable field visibly updates the canvas; settings reload from persisted project data; responsive modes change layout; export reflects edits; UI tests pass.
- **Milestone:** Business OS v2.0 Beta

### BO-014 — Complete Website Builder project and Template Vault lifecycle

- **Category:** Marketing
- **Description:** Add project/template rename, duplicate, delete, archive, restore, categories, and faithful React/HTML export.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-013, BO-011
- **Estimated Effort:** 8 days
- **Files Affected:** `app/api/website/`, `app/api/templates/`, `components/TemplateVault.tsx`, `components/ProjectSwitcher.tsx`, `tests/`
- **Acceptance Criteria:** Project and template CRUD works without duplicates; saved templates can be reused; exported HTML/JSON/React artifacts contain current content and assets.
- **Milestone:** Business OS v2.0 Beta

### BO-015 — Complete Affiliate Studio product and campaign lifecycle

- **Category:** Marketing
- **Description:** Add product filtering, tags, comparison, tracked links, campaign assignment, disclosure metadata, and local conversion records.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-006, BO-011
- **Estimated Effort:** 10 days
- **Files Affected:** `lib/affiliate.ts`, `app/affiliate-studio/`, `app/api/affiliate/`, `tests/`
- **Acceptance Criteria:** Products can be created, filtered, compared, linked, assigned to campaigns, and reported locally; duplicate links are prevented; tests pass.
- **Milestone:** Business OS v2.0 Beta

### BO-016 — Complete Social queue local lifecycle

- **Category:** Marketing
- **Description:** Add post edit, duplicate, retry, cancel, local scheduling, media association, and queue history without live platform credentials.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-009, BO-010, BO-011
- **Estimated Effort:** 8 days
- **Files Affected:** `app/social/`, `components/PostComposer.tsx`, `app/api/social/`, `lib/social*`, `tests/`
- **Acceptance Criteria:** A queued post can be edited, duplicated, scheduled, cancelled, retried, and audited; scheduled execution is deterministic in demo mode.
- **Milestone:** Business OS v2.0 Beta

### BO-017 — Complete CRM companies, deals, activities, timelines, and pipelines

- **Category:** CRM
- **Description:** Add company/deal entities and full lifecycle views linked to contacts, tasks, notes, activities, and pipeline stages.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-002, BO-004, BO-006
- **Estimated Effort:** 15 days
- **Files Affected:** `lib/crm/`, `app/api/contacts/`, `app/api/crm/`, `app/`, `tests/`
- **Acceptance Criteria:** Contacts, companies, deals, tasks, activities, notes, timeline, and pipeline transitions persist and are tenant-scoped; CRUD and lifecycle tests pass.
- **Milestone:** Business OS v2.0 Beta

### BO-018 — Complete finance ledger and operational workflows

- **Category:** Finance
- **Description:** Add invoices, expenses, revenue, budgets, double-entry ledger, reports, imports, exports, and reconciliation.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-002, BO-004, BO-006
- **Estimated Effort:** 20 days
- **Files Affected:** `lib/finance/`, `app/finances/`, `app/api/finances/`, `tests/`
- **Acceptance Criteria:** Financial transactions balance; imports validate; reconciliation identifies exceptions; reports/export are reproducible; financial tests pass.
- **Milestone:** Business OS v2.0 Beta

### BO-019 — Complete communications lifecycle

- **Category:** Communications
- **Description:** Add durable email/SMS/WhatsApp message records, templates, notifications, campaigns, consent, and delivery state while keeping providers deferred.
- **Priority:** MEDIUM
- **Status:** NOT STARTED
- **Dependencies:** BO-004, BO-010, BO-011
- **Estimated Effort:** 10 days
- **Files Affected:** `lib/comms/`, `app/comms/`, `app/api/comms/`, `tests/`
- **Acceptance Criteria:** Messages/templates/campaigns have lifecycle state, consent metadata, retries, and tenant scoping; demo mode is fully testable.
- **Milestone:** Business OS v2.0 Beta

### BO-020 — Add unified search, notifications, and activity feeds

- **Category:** Platform
- **Description:** Provide cross-workspace search and a durable notification/activity center.
- **Priority:** MEDIUM
- **Status:** NOT STARTED
- **Dependencies:** BO-006, BO-007, BO-011, BO-017
- **Estimated Effort:** 8 days
- **Files Affected:** `lib/search/`, `lib/notifications/`, `app/api/search/`, `app/`, `tests/`
- **Acceptance Criteria:** Users can search authorized records across domains; notifications have read/unread state; activity feed links to source records; tests pass.
- **Milestone:** Business OS v2.0 Beta

### BO-021 — Complete connector contracts and provider adapters

- **Category:** Connectors
- **Description:** Standardize connector interfaces, health checks, import/export contracts, API/file adapters, and safe webhook processing.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-005, BO-006, BO-008, BO-010
- **Estimated Effort:** 12 days
- **Files Affected:** `lib/connectors/`, `lib/integrations-catalog.ts`, `app/api/connections/`, `app/api/webhooks/`, `tests/`
- **Acceptance Criteria:** Each adapter reports capabilities and failures consistently; imports/exports are idempotent; webhooks are signed/replay-safe; contract mocks pass.
- **Milestone:** Business OS v2.0 RC

### BO-022 — Complete AI provider routing and usage controls

- **Category:** AI Runtime
- **Description:** Make OmniRoute-first routing, free-provider fallback, paid-provider fallback, quota tracking, and provider usage logs operational.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-007, BO-010, BO-021
- **Estimated Effort:** 8 days
- **Files Affected:** `lib/connectors/llm.ts`, `lib/connectors/omniroute.ts`, `app/api/ai/`, `app/integrations/`, `tests/`
- **Acceptance Criteria:** Routing order is deterministic; exhausted providers fail over; paid providers are never selected before configured free routes; usage is visible and tested.
- **Milestone:** Business OS v2.0 RC

### BO-023 — Finish live affiliate and social connector workflows

- **Category:** Connectors
- **Description:** Implement real affiliate product/conversion imports and live social publishing behind configured connectors, including Viator support.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-015, BO-016, BO-021, BO-022
- **Estimated Effort:** 15 days
- **Files Affected:** `lib/affiliate.ts`, `lib/connectors/`, `app/api/affiliate/`, `app/api/social/`, `tests/`
- **Acceptance Criteria:** Connector mocks import products/conversions and publish queued posts; idempotency, retries, disclosures, and failure states are tested.
- **Milestone:** Business OS v2.0 RC

### BO-024 — Add website crawl, SEO, competitor, and attribution pipelines

- **Category:** Analytics
- **Description:** Complete URL crawling/screenshot analysis, SEO audits, competitor research ingestion, cross-channel attribution, and reports.
- **Priority:** MEDIUM
- **Status:** NOT STARTED
- **Dependencies:** BO-010, BO-011, BO-020, BO-021
- **Estimated Effort:** 15 days
- **Files Affected:** `app/api/website/analyze/`, `lib/analytics/`, `app/analytics/`, `app/setup/`, `tests/`
- **Acceptance Criteria:** A URL produces repeatable crawl/audit output; research is source-attributed; campaign events map to links/conversions; reports/export pass tests.
- **Milestone:** Business OS v2.0 RC

### BO-025 — Complete analytics reports and exports

- **Category:** Analytics
- **Description:** Add configurable KPI dashboards, report builder, CSV/JSON/PDF exports, and metric definitions.
- **Priority:** MEDIUM
- **Status:** NOT STARTED
- **Dependencies:** BO-017, BO-018, BO-023, BO-024
- **Estimated Effort:** 10 days
- **Files Affected:** `app/analytics/`, `lib/analytics/`, `app/api/metrics/`, `tests/`
- **Acceptance Criteria:** Reports can be configured from authorized metrics; exports are deterministic and include date/source metadata; tests pass.
- **Milestone:** Business OS v2.0 RC

### BO-026 — Finish accessibility and responsive quality pass

- **Category:** UI
- **Description:** Perform complete WCAG-oriented keyboard, screen-reader, contrast, focus, and responsive validation across core workflows.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-013, BO-016, BO-020
- **Estimated Effort:** 8 days
- **Files Affected:** `app/`, `components/`, `app/globals.css`, `tests/`
- **Acceptance Criteria:** Core pages pass automated accessibility checks; keyboard workflows are complete; mobile/tablet/desktop smoke tests pass; defects are resolved.
- **Milestone:** Business OS v2.0 RC

### BO-027 — Add backup restore and disaster recovery drills

- **Category:** Deployment
- **Description:** Complete restore UI/process, backup versioning, validation, and recovery drills against isolated data.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-002, BO-009, BO-007
- **Estimated Effort:** 8 days
- **Files Affected:** `app/api/backup/`, `app/jobs/`, `scripts/`, `docs/`, `tests/`
- **Acceptance Criteria:** A backup restores into a clean environment without manual edits; integrity is checked; RPO/RTO are documented and exercised.
- **Milestone:** Business OS v2.0 GA

### BO-028 — Package deployment, Docker, environment, and monitoring

- **Category:** Deployment
- **Description:** Add reproducible Docker/deployment artifacts, production environment validation, monitoring, alerts, and stable start/restart workflow.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-008, BO-010, BO-021, BO-027
- **Estimated Effort:** 10 days
- **Files Affected:** `Dockerfile`, `docker-compose.yml`, `.env.example`, `.github/workflows/`, `next.config.mjs`, `docs/`
- **Acceptance Criteria:** Clean checkout builds and starts reproducibly; health/readiness alerts work; environment validation fails safely; deployment rollback is documented.
- **Milestone:** Business OS v2.0 GA

### BO-029 — Establish CI/CD, migrations, seeds, and end-to-end test gates

- **Category:** Testing
- **Description:** Make CI run typecheck, unit/integration/E2E/accessibility tests, migrations, seeds, build, and security checks on every change.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-002, BO-008, BO-010, BO-026, BO-028
- **Estimated Effort:** 8 days
- **Files Affected:** `.github/workflows/`, `tests/`, `scripts/`, `package.json`, `vitest.config.ts`
- **Acceptance Criteria:** CI blocks failures; clean database setup and seed run automatically; critical workflows have connector mocks; build and tests pass from a clean checkout.
- **Milestone:** Business OS v2.0 GA

### BO-030 — Complete operator, API, architecture, and release documentation

- **Category:** Documentation
- **Description:** Publish canonical setup, operating, API, architecture, recovery, security, connector, and contributor documentation.
- **Priority:** HIGH
- **Status:** NOT STARTED
- **Dependencies:** BO-001, BO-021, BO-027, BO-028, BO-029
- **Estimated Effort:** 8 days
- **Files Affected:** `README.md`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`
- **Acceptance Criteria:** A new operator can install, configure, run, recover, and deploy from docs; API and architecture references match current code; docs examples are tested.
- **Milestone:** Business OS v2.0 GA

### BO-031 — Execute final production readiness and canonical release gate

- **Category:** Platform
- **Description:** Run the release checklist, close all Critical/High tasks, validate production readiness, and authorize Business OS v2.0 GA.
- **Priority:** CRITICAL
- **Status:** NOT STARTED
- **Dependencies:** BO-023, BO-024, BO-025, BO-026, BO-027, BO-028, BO-029, BO-030
- **Estimated Effort:** 5 days
- **Files Affected:** `BUSINESS_OS_MASTER_BACKLOG.md`, `BUSINESS_OS_RELEASE_CHECKLIST.md`, `docs/`
- **Acceptance Criteria:** Every CRITICAL and HIGH backlog item is COMPLETE; release checklist passes; build/tests/docs/deployment/recovery pass; Travel Commerce OS remains paused until this gate passes.
- **Milestone:** Business OS v2.0 GA

## Execution order

Work on the highest-priority NOT STARTED item whose dependencies are COMPLETE. After each item: update this file, commit the change, run its acceptance checks, and proceed. Do not begin blocked items.

## Release decision

Business OS v2 is not GA until BO-031 is COMPLETE.
