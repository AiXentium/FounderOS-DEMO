# Business OS v2 Roadmap

> Historical roadmap updated to reflect the canonical execution order. The master backlog remains the only execution source of truth.

## Epic 0 — Business OS v2 Modernization

Complete BO-000A through BO-000I in order before platform features: upgrade Next.js and React, establish pnpm workspace compatibility, add Prisma alongside SQLite, introduce PostgreSQL in parallel, convert repositories incrementally, migrate seeds, validate parity, and remove SQLite as the production primary only after parity is confirmed.

BO-003 remains blocked until every Epic 0 item is COMPLETE.

BO-000A and BO-000B are complete, including their quality gates. BO-000C is the next modernization task.

## Phase 1 — secure foundation

Deliver identity, organizations, workspaces, roles, permissions, migrations, production storage, secrets, audit logs, rate limiting, and error/observability standards.

Exit condition: isolated users can safely operate the local and deployed system with recoverable data and auditable mutations.

## Phase 2 — reliable core operations

Deliver durable queues, workers, scheduler, retries, quotas, notifications, unified search, project memory, agent assignment, and backup restore.

Exit condition: setup, website, affiliate, social, agent, and job workflows survive restart and failure without manual database repair.

## Phase 3 — complete workspaces

Deliver full Website Builder editing/responsive preview/template/project management; Affiliate Studio imports/conversions; Social queue lifecycle; CRM deals/timelines; finance ledger/reconciliation; communications campaigns.

Exit condition: each core workspace supports a complete local lifecycle from input to saved output and report.

## Phase 4 — connector and intelligence layer

Deliver OAuth, token refresh, affiliate/social/email/WhatsApp/file connectors, live publishing/importing, SEO crawl/audit, attribution, competitor research, and provider failover telemetry.

Exit condition: credentials can be added later without changing product workflows, and connector failures are retried and visible.

## Phase 5 — production release

Deliver Docker/deployment artifacts, CI/CD, monitoring/alerts, restore drills, accessibility/responsive certification, API/operator documentation, and end-to-end connector mocks.

Exit condition: the release checklist passes with no Critical or High gaps.

## Canonical-platform gate

Business OS v2 becomes the canonical platform only after Phase 1, Phase 2, and the release-critical parts of Phases 3–5 are complete. The current audit decision is NO.
