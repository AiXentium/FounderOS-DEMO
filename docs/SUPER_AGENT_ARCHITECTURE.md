# Business OS Super Agent Architecture

Status: ARCHITECTURE BLUEPRINT ONLY
Branch: `super-agent-blueprint`
Runtime changes: NONE in this phase

## Purpose

Business OS is the reference implementation for a reusable AI business runtime. The goal is to prove that one core architecture can understand a business, compose an AI organization, operate business modules, execute work, measure outcomes, and learn across many industries.

This program EXTENDS the existing Founder OS / Business OS implementation. It does not replace the current agent runtime, Conductor, G-Brain, repository layer, model routing, connector framework, jobs, approvals, or product modules.

## Non-negotiable preservation rules

1. Preserve the current `lib/agents/runtime.ts` and `lib/agents/real.ts` behavior as the starting runtime contract.
2. Preserve the existing 1:1 mapping between seeded agent records and real runtime agents.
3. Preserve persisted `agent_runs` and extend them rather than creating a parallel run-history system.
4. Preserve G-Brain as the current business knowledge provider and extend through provider contracts rather than replacing it.
5. Preserve OmniRoute/model routing and keep Super Agents model-independent.
6. Preserve existing connector contracts and honest connection status behavior.
7. Preserve repository-layer boundaries. Pages and routes must not bypass application/repository services.
8. Preserve `/org` markup. Super Agent work must not restructure the frozen organization view.
9. Preserve existing approvals, jobs, analytics, CRM, finance, marketing, website, social, affiliate, and communications capabilities.
10. No third-party agent framework becomes the source of truth for Business OS.

## Existing foundation: reuse first

Current Business OS already provides the following foundations and they are classified as REUSE / EXTEND:

| Capability | Current state | Super Agent action |
|---|---|---|
| Agent runtime | Implemented | EXTEND |
| Agent registry | Implemented | EXTEND |
| Skills registry | Implemented | EXTEND |
| Agent run persistence | Implemented | EXTEND |
| G-Brain memory/knowledge | Implemented | EXTEND |
| Knowledge graph | Implemented | EXTEND |
| Task execution | Implemented | EXTEND |
| Model routing | Implemented | REUSE |
| Connector framework | Implemented | REUSE |
| API routes | Implemented | EXTEND through services |
| KPI/analytics surfaces | Implemented | REUSE |
| Jobs/operations surfaces | Partial | COMPLETE before autonomous Super Agent execution |
| Planning | Partial | COMPLETE |
| Multi-agent orchestration | Partial | COMPLETE |
| Project-scoped memory | Backlog | COMPLETE before long-running Super Agents |
| Agent-to-project assignment | Backlog | COMPLETE before organization composition |
| RBAC/permissions | Backlog | REQUIRED before autonomous write authority |
| Audit/observability | Backlog | REQUIRED before autonomous write authority |

## What we are using

### Native Business OS systems

These remain the production foundation:

- Business OS / Founder OS application and domain modules
- Existing agent runtime and registry
- Existing skills registry
- Existing G-Brain provider and knowledge graph
- Existing OmniRoute/model-routing layer
- Existing connector framework
- Existing jobs and operations model
- Existing repository/service/API boundaries
- Existing approval patterns
- Existing analytics/KPI system
- Existing authentication/RBAC work as it lands in the canonical backlog

### External projects used as architecture donors only

No donor is installed by default. Each must pass an architecture review before any dependency is introduced.

- Microsoft Agent Framework: orchestration patterns (sequential, parallel, handoff, supervisor/group workflows)
- LangGraph: durable graph execution, checkpoints, resumability, state-machine concepts
- Letta: stateful agent-memory concepts
- Agno: agent control-plane and observability concepts
- OpenHands: developer-agent execution and verification concepts
- Browser Use: browser-agent execution concepts
- Bytebot: isolated virtual-computer concepts for a later phase
- MetaGPT: role/SOP organizational concepts
- ChatDev: configurable team/workflow concepts
- Pydantic AI: typed agent/tool contract concepts
- LlamaIndex: knowledge/RAG patterns only where existing G-Brain contracts need an extension

Rule: borrow behavior and contracts, not project ownership. Business OS remains the source of truth.

## Target operating model

```text
Business Owner
    |
    v
TBrain / Business Intelligence Layer
    |
    +-- Business Context / Business Graph
    +-- Memory / Knowledge
    +-- Goal and Task Analysis
    +-- Capability Discovery
    +-- Model Policy
    +-- Governance
    |
    v
Conductor / AI Chief of Staff
    |
    v
CEO Super Agent
    |
    +-- CFO Super Agent
    +-- CMO Super Agent
    +-- CRO / Sales Super Agent
    +-- COO Super Agent
    +-- CTO Super Agent
    +-- Customer Success Super Agent
    +-- optional vertical executives
            |
            v
      Team Composer
            |
            v
 Specialist / Temporary Agents
            |
            v
 Orchestration + Durable Jobs
            |
            v
 Tools / Connectors / MCP / Business APIs
            |
            v
 Evidence + Judge + KPI measurement
            |
            v
 Memory / Learning
```

## Universal Super Agent contract

A Super Agent is not a prompt. It is a governed runtime entity composed from existing Business OS primitives.

```text
SuperAgent
  identity
  role
  department
  mission
  goals
  responsibilities
  authority
  permissions
  approval policy
  model policy
  skills
  tools
  connectors
  knowledge scopes
  memory scopes
  workflows / SOPs
  team policy
  subagent policy
  project assignments
  KPIs
  execution policy
  evaluation policy
  learning policy
```

CEO, CFO, CMO, CRO, COO, CTO, and vertical executives must be configurations of this contract, not independent runtimes.

## Super Agent hierarchy

### TBrain

TBrain is the global business-intelligence layer. It understands the company and determines what capability is required. It does not become a replacement for every worker.

Responsibilities:

1. Resolve tenant/business/project context.
2. Load relevant business memory and knowledge.
3. Interpret goals and requests.
4. Decompose objectives into work.
5. Discover existing capabilities before creating new agents.
6. Select the appropriate executive Super Agent.
7. Compose specialist teams when needed.
8. Select model policy through the existing router.
9. Establish governance and approval requirements.
10. Monitor execution and KPIs.
11. Record verified outcomes and lessons.

### Conductor / AI Chief of Staff

The existing Conductor remains the human-facing coordination surface. Its runtime responsibilities are extended to coordinate executive Super Agents and cross-department work.

### CEO Super Agent

Owns company-level strategy and cross-functional coordination. The CEO does not directly perform specialist work when a department or capability exists.

### Department Super Agents

Initial permanent team:

- CFO: finance and financial intelligence
- CMO: marketing, content, brand, social, SEO, campaigns
- CRO/Sales: CRM, leads, pipeline, sales execution
- COO: projects, workflows, operations, vendors
- CTO: technology, integrations, automation, website/runtime systems
- Customer Success: onboarding, support, retention and customer health

Additional executives are created from the same contract for industry-specific needs.

## Capability Registry

Create one discoverable capability graph across existing systems:

```text
Capabilities
  agents
  skills
  tools
  connectors
  MCP services
  APIs
  workflows
  models
  knowledge sources
  execution environments
```

Each capability must expose at minimum:

- stable ID
- name
- description
- inputs
- outputs
- required permissions
- risk class
- cost class
- dependencies
- availability/health
- owning domain

TBrain and Team Composer must search this registry before creating a new specialist.

## Business Brain / Business Graph

Create a tenant-scoped canonical representation of the company using existing memory/knowledge contracts:

- company identity
- industry and business model
- products and services
- customers and segments
- locations
- employees and departments
- vendors
- competitors
- revenue model
- financial state
- marketing channels
- sales channels
- connected software
- goals
- KPIs
- policies
- SOPs
- projects
- decisions and lessons

The graph is shared context, not duplicated inside each agent prompt.

## Memory model

Required scopes:

- global system knowledge
- tenant/business memory
- department memory
- project memory
- agent memory
- task/run memory

Required memory classes:

- facts
- decisions
- events
- outcomes
- lessons
- failures
- preferences
- SOPs
- KPI history
- relationships

Only verified outcomes should become durable learning. Failed or unverified agent assertions must not be promoted as facts.

## Orchestration patterns

Initial native patterns:

1. Direct: one agent owns one task.
2. Sequential: A -> B -> C.
3. Parallel: independent workers execute concurrently.
4. Supervisor: executive manages workers.
5. Handoff: ownership transfers between departments.
6. Plan -> Execute -> Judge -> Repair: durable controlled execution.

Do not implement swarm/debate modes until the six base patterns are reliable and measurable.

## Team Composer

Team Composer converts capability requirements into temporary execution teams.

```text
Objective
 -> required capabilities
 -> capability registry search
 -> choose executive owner
 -> choose existing specialists
 -> spawn temporary workers only when necessary
 -> assign workflow and permissions
 -> execute
 -> evaluate
 -> persist results
 -> dissolve temporary team
```

The existing skills/agent ecosystem should be reused before creating permanent agents.

## Tool / execution gateway

All Super Agent action must pass through governed Business OS contracts:

- Business OS domain services
- connectors
- MCP services
- browser execution
- GitHub/developer execution
- website/WordPress execution
- email/calendar/communications
- file and asset systems
- approved external APIs
- isolated computer runtime in a later phase

No Super Agent may bypass permissions by querying or mutating persistence directly.

## Governance levels

Every executable capability must declare a risk/approval class.

### GREEN

Read-only analysis and low-risk reversible actions may auto-execute when permissions permit.

Examples: research, analytics, drafting, internal summaries, KPI analysis.

### YELLOW

External or business-changing actions require policy-driven approval unless the tenant explicitly delegates them.

Examples: publishing, sending campaigns, customer contact, changing advertising, creating invoices.

### RED

High-risk actions remain human controlled.

Examples: transferring funds, signing contracts, changing ownership/security authority, destructive critical-data actions, employment termination.

## Judge and evidence contract

Completion is evidence-based.

```text
Worker result
 -> independent verification
 -> PASS: record evidence and complete
 -> FAIL: record reason -> repair/retry policy
```

Agents must not self-certify important work merely by claiming success.

## Observability requirements

Before meaningful autonomy, Business OS must expose:

- active agent/team
- tenant/project
- objective
- plan step
- model/provider
- tool calls
- approvals
- retries
- errors
- evidence
- cost/usage when available
- KPI/result linkage
- audit actor and authority

This extends the existing jobs/operations and audit backlog rather than creating a second monitoring platform.

# Blueprint-gated execution program

The Super Agent program is intentionally dependent on the canonical Business OS v2 backlog. Existing BO work remains authoritative.

## SA-0 - Forensic architecture audit

Status: IN PROGRESS / documentation only.

Deliverables:

- map existing runtime, agents, skills, memory, model routing, connectors, jobs, approvals, projects and domain services
- classify each as KEEP / EXTEND / REFACTOR / MISSING / DUPLICATE
- identify exact code-level integration points
- no runtime changes

Gate: no SA runtime implementation until the audit is accepted.

## SA-1 - Universal Super Agent contract

Dependencies: BO-001 domain boundaries; SA-0.

Deliverables:

- typed SuperAgent definition
- role/department/authority contracts
- model/skill/tool/memory/team/evaluation policies
- compatibility adapter for current RuntimeAgent

Gate: existing agents continue running unchanged; at least three different executive configurations validate against one contract.

## SA-2 - Unified capability registry

Dependencies: SA-1; existing agent/skills/connector registries.

Deliverables:

- capability descriptor
- discovery/search service
- health/availability metadata
- permission/risk metadata

Gate: TBrain can discover existing capabilities without hard-coded role lists.

## SA-3 - Business Brain contract

Dependencies: BO-004 tenant boundaries; BO-011 shared memory; SA-2.

Deliverables:

- tenant/project-scoped business context schema
- graph relationships
- knowledge source adapters
- verified-fact rules

Gate: two different test companies load isolated context with no cross-tenant leakage.

## SA-4 - TBrain orchestration service

Dependencies: SA-2, SA-3; existing model router.

Deliverables:

- intent/objective analysis
- capability resolution
- executive routing
- team request contract
- model policy request

Gate: routing is explainable and uses existing capabilities first.

## SA-5 - Durable orchestration engine

Dependencies: BO-010 durable jobs; BO-012 durable planning; SA-4.

Deliverables:

- direct
- sequential
- parallel
- supervisor
- handoff
- plan/execute/judge/repair
- checkpoint/restart semantics

Architecture donors: Microsoft Agent Framework and LangGraph concepts. No mandatory framework installation.

Gate: workflow survives process restart and resumes without duplicate side effects.

## SA-6 - Team Composer

Dependencies: SA-2, SA-5.

Deliverables:

- capability-to-team composition
- executive ownership
- temporary worker lifecycle
- skill/tool assignment
- team dissolution

Gate: one cross-functional objective can be executed by a dynamically composed team using existing agents/skills.

## SA-7 - Executive Super Agent pack

Dependencies: SA-1 through SA-6.

Initial configurations:

- CEO
- Chief of Staff / Conductor extension
- CFO
- CMO
- CRO / Sales
- COO
- CTO
- Customer Success

Gate: all executives use the same native runtime contract.

## SA-8 - Domain ownership adapters

Dependencies: BO-006 service boundaries; SA-7.

Map executive authority to Business OS services:

- CFO -> finance/accounting/revenue/forecasting
- CMO -> marketing/content/social/SEO/campaigns/website demand generation
- CRO -> CRM/leads/pipeline/follow-up
- COO -> projects/workflows/operations/vendors
- CTO -> integrations/automation/website/runtime systems
- Customer Success -> onboarding/support/retention/customer health

Gate: agents operate domain services, not UI scraping or direct DB access.

## SA-9 - Governance and approval engine integration

Dependencies: BO-003 auth; BO-004 RBAC; BO-007 audit; BO-008 security; SA-8.

Deliverables:

- green/yellow/red risk classes
- delegated authority
- approval requests
- expiry/cancellation
- evidence/audit linkage

Gate: unauthorized agent action is impossible through supported execution paths.

## SA-10 - Judge / verification service

Dependencies: SA-5, SA-9.

Deliverables:

- task-specific evidence requirements
- independent verification
- pass/fail reasons
- bounded retry/repair policy

Gate: important actions cannot become DONE without required evidence.

## SA-11 - Learning loop

Dependencies: SA-3, SA-10.

Deliverables:

- verified outcome capture
- failure memory
- lesson extraction
- SOP improvement proposals
- KPI effect linkage

Gate: only verified lessons enter durable business memory.

## SA-12 - AI Operations Center

Dependencies: BO-007 observability; BO-010 jobs; SA-5, SA-9, SA-10.

Deliverables:

- active Super Agents/teams
- objectives and progress
- approvals
- failures/retries
- evidence
- usage/cost
- business KPI linkage

Gate: operator can reconstruct what an AI team did and under whose authority.

## SA-13 - Super Agent Factory

Dependencies: SA-1 through SA-12.

Deliverables:

- visual configuration of role, mission, skills, tools, memory, SOPs, KPIs, permissions and team policy
- validation against universal contract
- templates without code duplication

Gate: create a new vertical executive without writing a new runtime.

## SA-14 - Organization Composer

Dependencies: SA-13; Business Brain.

Deliverables:

- business profiler
- capability requirements
- recommended executive organization
- optional vertical roles
- owner approval before activation

Gate: generate distinct organizations for at least construction, professional services, ecommerce, and affiliate businesses from the same engine.

## SA-15 - SOP / workflow builder

Dependencies: SA-5, SA-13.

Deliverables:

- reusable business SOP definition
- agent/department steps
- approvals
- conditions
- retry/recovery
- KPI/output expectations

Architecture donors: MetaGPT/ChatDev concepts.

Gate: execute one end-to-end lead and one marketing SOP through durable orchestration.

## SA-16 - Proactive business intelligence

Dependencies: SA-3, SA-7, SA-10, analytics/KPI infrastructure.

Deliverables:

- KPI watches
- anomaly detection
- investigation requests
- cross-functional diagnosis
- recommended actions
- approval-aware execution

Gate: detect and investigate a seeded business KPI degradation without a user prompt.

## SA-17 - Browser/computer execution expansion

Dependencies: SA-9 governance and isolation requirements.

Deliverables:

- browser execution contract
- evidence capture
- credential boundary
- optional isolated-computer runtime evaluation

Architecture donors: Browser Use and Bytebot concepts.

Gate: external action is reproducible, governed, audited, and evidence-backed.

## SA-18 - Golden Business Test

Dependencies: SA-0 through SA-17 and required BO foundations.

Reference scenario:

1. onboard a new company
2. build business context
3. recommend AI organization
4. owner approves organization
5. establish goals/KPIs
6. CEO creates strategy
7. departments create plans
8. Team Composer creates specialists
9. execute real Business OS workflows
10. persist plans/results
11. detect KPI degradation
12. investigate across departments
13. recommend corrective action
14. request required approval
15. execute correction
16. independently verify
17. measure result
18. record verified learning
19. produce executive report
20. restart runtime and resume correctly

Gate: all steps pass with evidence, tenant isolation, audit history, and no duplicate side effects.

## SA-19 - Cross-industry portability test

Run the Golden Business Test against multiple business profiles without forking the runtime.

Minimum profiles:

- local service business
- construction business
- professional services
- ecommerce
- affiliate/content business

Gate: industry specialization is configuration/capability composition, not duplicated platform code.

## SA-20 - Production autonomy gate

No production autonomy until:

- authentication and tenant isolation are enforced
- permissions/RBAC are enforced
- audit events exist
- durable jobs and recovery exist
- project/business memory is tenant-scoped
- approval engine is enforced
- judge/evidence contracts are enforced
- rate/security controls pass
- rollback/recovery is documented
- Golden Business Test passes

## Relationship to canonical Business OS backlog

Super Agent milestones do not bypass Business OS platform prerequisites.

Critical dependencies include:

- BO-003 authentication
- BO-004 organizations/workspaces/RBAC
- BO-006 repository/service boundaries
- BO-007 audit and observability
- BO-008 security baseline
- BO-010 durable jobs/scheduler/retry/quota runtime
- BO-011 shared project memory
- BO-012 agent-to-project assignment and durable planning

If one of these is incomplete, the dependent SA phase remains gated rather than creating a parallel substitute.

## Initial implementation decision

Do not install Microsoft Agent Framework, LangGraph, Letta, Agno, OpenHands, Browser Use, Bytebot, MetaGPT, or ChatDev during SA-0.

First inspect their relevant contracts and compare them against native Business OS needs. Adopt a dependency only when it demonstrably reduces complexity while preserving Business OS ownership of contracts, state, permissions, observability, and persistence.

## Definition of success

Business OS succeeds as the reference Super Agent platform when a business owner can onboard a company and the system can safely:

- understand the business
- construct the right AI organization
- assign goals and authority
- compose specialist teams
- execute through real business systems
- require approval where appropriate
- recover from failures
- verify outcomes
- connect work to KPIs
- learn only from verified results
- remain portable across industries without forking the core runtime
