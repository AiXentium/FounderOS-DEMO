# Business OS v2 Domain Boundaries

This is the canonical ownership map for the current application. Routes are presentation/application entry points; `lib/` owns domain calculations, connectors, and persistence helpers; `components/` owns browser UI.

| Domain | Owns | Public entry points | Persistence / external boundary |
|---|---|---|---|
| Platform | App shell, configuration, health, jobs, settings, shared validation | `app/layout.tsx`, `app/api/health/`, `app/api/readiness/`, `app/api/jobs/` | `lib/data.ts`, `lib/db.ts` |
| Workspace | Projects, workspaces, setup intake, client context | `app/setup/`, `app/api/setup/`, `app/api/projects/`, `app/api/workspaces/` | `lib/system-context.ts`, SQLite |
| AI Runtime | Agents, skills, conductor, model routing, AI actions | `app/agents/`, `app/api/agents/`, `app/api/ai/` | `lib/agents/`, `lib/connectors/llm.ts`, `lib/connectors/omniroute.ts` |
| Memory / Knowledge | Brain documents, dumps, graph, search, context | `app/brain/`, `app/api/brain/` | `lib/brain*.ts`, `lib/knowledge-graph.ts` |
| CRM | Contacts, leads, funnel records, tags, tasks | `app/api/contacts/`, `app/api/lead-magnets/`, `app/funnel/` | `lib/funnel*.ts`, `lib/data.ts` |
| Finance | Statements, bank data, finance metrics, ledger foundations | `app/finances/`, `app/api/finances/` | `lib/finances.ts`, `lib/bank*.ts`, `lib/ledger.ts` |
| Communications | Inbox, email threads, replies, messaging/webhooks | `app/comms/`, `app/api/comms/`, `app/api/webhooks/` | `lib/comms*.ts`, `lib/connectors/email.ts`, provider adapters |
| Marketing | Website, affiliate, social, content, campaigns, assets | `app/website-builder/`, `app/affiliate-studio/`, `app/social/`, `app/content/` | `lib/affiliate.ts`, `lib/social*.ts`, `lib/assets.ts`, `lib/content.ts` |
| Analytics | Metrics, charts, dashboards, attribution calculations | `app/analytics/`, `app/api/metrics/`, social analytics routes | `lib/analytics.ts`, `lib/operating-metrics.ts`, `lib/engagement.ts` |
| Connectors | Provider adapters, catalog, credentials, live sync contracts | `app/integrations/`, `app/api/connections/`, connector API routes | `lib/connectors/`, `lib/integrations-catalog.ts`, `lib/keys.ts` |
| Deployment | Runtime environment, backups, readiness, release artifacts | `app/api/backup/`, `app/api/readiness/`, package scripts | `.env.example`, `next.config.mjs`, `scripts/` |

## Contract rules

1. App routes validate input and return HTTP responses; domain modules perform calculations and provider calls.
2. UI components call public APIs and own browser state; they do not access SQLite directly.
3. Connector modules isolate external services and must expose demo-safe behavior when credentials are absent.
4. Memory and project context are cross-domain services, but records must remain scoped to their owning project/workspace.
5. New persistence must enter through `lib/db.ts`/`lib/data.ts` until the migration layer replaces them.
6. Cross-domain writes must be explicit in the calling application service; domains must not import UI components.

## Duplicate-scope decisions

- Social, affiliate, and website campaign behavior belongs to Marketing; Connectors only transport or synchronize it.
- Agent execution belongs to AI Runtime; generic retries/queues belong to Platform.
- Brain storage/search belongs to Memory/Knowledge; project setup only creates and references context.
- Dashboard components present data but do not own domain calculations.
