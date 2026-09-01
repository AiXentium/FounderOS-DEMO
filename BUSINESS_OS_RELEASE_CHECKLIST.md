# Business OS Release Checklist

## Identity and security

- [ ] Authentication and session revocation work.
- [ ] Organization/workspace isolation is enforced server-side.
- [ ] Roles and permissions cover every mutation/API route.
- [ ] Secrets are stored in a production secret manager and rotated.
- [ ] Audit logs capture security and business mutations.
- [ ] Rate limiting, CSRF/origin controls, security headers, and upload scanning are active.

## Data and runtime

- [ ] Versioned migrations run on a clean production database.
- [ ] Backup restore has been tested on a separate environment.
- [ ] Queues, workers, scheduler, retries, idempotency, and dead-letter handling work.
- [ ] Structured logs, metrics, traces, health checks, and alerts are connected.
- [ ] No local-only storage remains on production paths.

## Product workflows

- [ ] Setup creates a project and shared memory context.
- [ ] Website Builder edits, saves, reloads, previews, templates, assets, and exports work.
- [ ] Affiliate Studio imports products, creates links/campaigns, and records conversions.
- [ ] Social creates, edits, schedules, retries, and publishes posts.
- [ ] Agents can be assigned to projects and produce durable job results.
- [ ] CRM, finance, communications, marketing, and analytics workflows have complete lifecycle tests.

## Integrations

- [ ] OAuth callback/token refresh is tested for each provider.
- [ ] API connectors have contract mocks and failure handling.
- [ ] Webhooks are signed, replay-safe, idempotent, and observable.
- [ ] Provider quota/failover behavior is visible.

## Quality and delivery

- [ ] Unit, integration, end-to-end, accessibility, and responsive tests pass.
- [ ] Production build and start command pass from a clean checkout.
- [ ] CI runs typecheck, tests, build, migrations, and security checks.
- [ ] Docker/deployment artifact is reproducible.
- [ ] Operator documentation and rollback runbook are complete.
- [ ] No critical/high gap remains open.
