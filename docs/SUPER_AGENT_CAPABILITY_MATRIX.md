# Business OS Super Agent Capability Matrix

Status: SA-0 AUDIT ARTIFACT
Branch: `super-agent-blueprint`
Runtime changes: NONE

## Purpose

This document inventories the capabilities visible in the current Business OS repository and maps them to the proposed Super Agent organization. It exists to prevent duplicate agents, duplicate skills, duplicate tools, and competing brain/orchestration systems.

Classification vocabulary:

- REUSE: existing capability is sufficient as a building block.
- EXTEND: keep existing implementation and add missing contract/behavior.
- COMPOSE: Super Agent should delegate to existing agents/skills rather than reimplement them.
- PROMOTE TO SHARED: capability currently owned by one agent should become discoverable through the common capability registry where permissions allow.
- MISSING: no adequate native capability identified in this repository audit.
- DEFER: useful later, but not required for the first Golden Business Test.

## 1. Existing agent workforce

The current seed/runtime contract already defines a real operational hierarchy. These are assets, not prototypes to discard.

### Orchestration and technology
- Conductor: broadcast and fleet orchestration.
- Data Agent: G-Brain analysis.
- Markdown Auditor: brain-store health.
- Vector Auditor: Supabase/vector health.
- Notion Sync: workspace ingestion, planned.
- Stack Monitor: local runtime/tool health.

### Communications
- Comms Agent: unified communications owner.
- Gmail Worker: inbox triage, planned pending credentials.
- WhatsApp Worker: local chat monitoring.
- Slack Worker: channel digest, planned pending credentials.

### Marketing and growth
- Social Agent: social/content lead.
- Postly Publisher: multi-platform publishing.
- Adsmith Creative: UGC ad generation.
- Reelkit Editor: video editing pipeline.
- Renderly Creative: AI visual production.
- DMFlow MCP: DM automation, planned.

### Sales and revenue
- Sales Agent: deals/pipeline lead.
- Launchpad Cohort Sales: account lane, planned.
- Vantage Sales: account lane, planned.
- Vantage PayKit: offer/payment lane, planned.
- Sales Calls Data: Recall/CRM call intelligence, planned.
- Ledger CRM / CRM Pulse: live CRM hygiene and pipeline data.

### Finance
- Payments Pulse: processor monitoring, planned.
- PayKit: income/payment context, planned.
- Stripe: income/payment context, planned.
- Processor Confirm: payment verification, planned.
- FlexPay Financing: financing options, planned.

### Clients
- Client Roster: client source of truth.
- Onboarding Agent: closed-won to kickoff, planned.
- Client Success: service/renewal workflow, planned.

## 2. Existing operator skills

The repository currently seeds 23 operator skills. The Super Agent program must preserve these and attach them to the capability registry rather than recreate them.

| Existing skill | Status | Super Agent treatment | Primary future owner |
|---|---|---|---|
| Cold outbound sequencing | live | COMPOSE | CRO / CMO |
| Reply qualification | live | COMPOSE | CRO |
| Proposal drafting | learning | EXTEND | CRO |
| Hook writing | live | COMPOSE | CMO |
| UGC generation | live | COMPOSE | CMO |
| Video editing | live | COMPOSE | CMO |
| Cross-post scheduling | live | COMPOSE | CMO |
| Inbox triage | live | PROMOTE TO SHARED | Chief of Staff |
| DM management | live | COMPOSE | CRO / Customer Success |
| Knowledge retrieval | live | PROMOTE TO SHARED | TBrain / all permitted Super Agents |
| Payment reconciliation | planned | EXTEND | CFO |
| Revenue attribution | planned | EXTEND | CFO / CMO / CRO |
| Destination research | learning | COMPOSE, vertical capability | CMO / Travel vertical |
| Affiliate campaign planning | learning | COMPOSE, vertical capability | CMO / Affiliate vertical |
| SEO content brief | learning | COMPOSE | CMO |
| Affiliate blog builder | learning | COMPOSE, vertical capability | CMO |
| Brand voice guardian | learning | PROMOTE TO SHARED | CMO |
| WordPress page publishing | planned | EXTEND with approvals | CMO / CTO |
| Image campaign analysis | learning | COMPOSE | CMO |
| Seasonal campaign calendar | planned | EXTEND | CMO |
| Social performance analysis | learning | EXTEND | CMO |
| Affiliate compliance review | planned | EXTEND | Compliance / CMO |
| Campaign retrospective | planned | EXTEND into learning loop | CMO / TBrain |

Important: the Skills page can also read real user-scope Claude Code skills and installed-plugin skills from opt-in filesystem locations. Those machine-local catalogs are dynamic and are not fully enumerable from GitHub alone. They must be inventoried at runtime on the Business OS host before SA-2 is closed.

## 3. Existing tools and connectors

### Knowledge
G-Brain, brain-store, ZeroEntropy, Supabase Second Brain, Obsidian/Notes Vault, Notion.

### Social and growth
Postly, DMFlow, Skool.

### CRM and revenue
Ledger, PayKit, FlexPay, Stripe, GoHighLevel, Recall, WebinarJam, Trakyo.

### Creative
Reelkit, Renderly, Adsmith, Whisper, Miro, Canva/Figma.

### Communications
IMAP email, Slack, Dictate Flow, WhatsApp.

### Orchestration and infrastructure
Command Center, Clawline, tmux, Ollama, Vercel CLI, GitHub CLI.

### Payments
Stripe plus registered/planned PayPal, Square, Whop and PayKit lanes.

Super Agent treatment: REUSE these through a common permissioned tool/capability gateway. Do not make executive agents own private duplicate integrations.

## 4. What Super Agents actually add

The Super Agent program is primarily a management and intelligence layer over the existing workforce.

### TBrain
Existing assets: G-Brain, knowledge retrieval, Conductor, run history, model routing.
Adds:
- objective interpretation across the business;
- business/project context assembly;
- capability discovery;
- executive-agent selection;
- cross-department plan construction;
- persistent mission state;
- outcome learning and retrieval.
Classification: EXTEND existing brain/orchestration architecture. Do not create a competing brain.

### CEO Super Agent
Existing assets: analytics, metrics, departments, workflows, agents, projects/business modules.
Adds:
- company goal hierarchy;
- strategic plan decomposition;
- cross-department prioritization;
- executive delegation;
- KPI review and exception management;
- synthesis of CFO/CMO/CRO/COO/CTO recommendations.
Classification: MISSING as a true executive manager; build from universal SuperAgent contract.

### Chief of Staff Super Agent
Existing assets: Comms Agent, inbox triage, task board, Conductor broadcasts.
Adds:
- executive intake and routing;
- meeting/action-item coordination;
- decision queue;
- approval queue;
- daily/weekly executive brief;
- follow-up enforcement across departments.
Classification: EXTEND/COMPOSE.

### CFO Super Agent
Existing assets: Payments Pulse, Stripe, PayKit, Processor Confirm, FlexPay, bank statements, finance analytics.
Adds:
- budget ownership;
- cash-flow forecasting;
- variance analysis;
- financial KPI monitoring;
- profitability/margin analysis;
- scenario planning;
- finance recommendations and approval-gated actions.
Classification: EXTEND/COMPOSE. Existing finance workers remain.

### CMO Super Agent
Existing assets: Social Agent, Postly, Adsmith, Reelkit, Renderly, DMFlow, hooks, UGC, scheduling, SEO briefs, brand voice, campaign calendar, analytics.
Adds:
- marketing strategy;
- campaign portfolio ownership;
- channel/resource allocation;
- KPI targets;
- experiment design;
- team composition per campaign;
- retrospective-to-next-plan learning.
Classification: EXTEND/COMPOSE. Do not rebuild content workers.

### CRO / Sales Super Agent
Existing assets: Sales Agent, Ledger CRM, reply qualification, outbound, proposal drafting, payment links, sales-call intelligence.
Adds:
- revenue target ownership;
- pipeline strategy;
- forecasting;
- lead-routing policy;
- deal-risk detection;
- cross-sell/upsell strategy;
- sales/marketing handoffs;
- team composition for revenue missions.
Classification: EXTEND/COMPOSE.

### COO Super Agent
Existing assets: workflows, SOP tasks, client onboarding, client success, task board, stack/operations surfaces.
Adds:
- operating-plan ownership;
- process health and bottleneck detection;
- capacity/resource planning;
- SLA monitoring;
- workflow optimization;
- recurring operational missions;
- cross-department execution coordination.
Classification: MISSING/PARTIAL, then COMPOSE existing workflow agents.

### CTO Super Agent
Existing assets: Stack Monitor, connectors, model routing, G-Brain infrastructure, GitHub/Vercel/tmux/Ollama/Clawline, runtime agents.
Adds:
- technical roadmap ownership;
- architecture policy;
- reliability/security posture;
- integration health ownership;
- developer-agent delegation;
- change verification and rollback policy;
- cost/performance optimization of AI runtime.
Classification: EXTEND/COMPOSE.

### Customer Success Super Agent
Existing assets: Client Roster, Onboarding Agent, Client Success worker, communications, Recall, Ledger.
Adds:
- retention target ownership;
- account-health strategy;
- churn-risk detection;
- renewal/expansion planning;
- service escalation management;
- voice-of-customer feedback into CEO/CMO/CRO/COO.
Classification: EXTEND/COMPOSE.

## 5. Cross-cutting capabilities missing or partial

These are the high-value additions. They should be built once for every Super Agent.

| Capability | Current assessment | Action |
|---|---|---|
| Universal SuperAgent contract | missing | BUILD |
| Capability registry spanning agents/skills/tools/workflows/models | partial | EXTEND |
| Dynamic Team Composer | missing | BUILD |
| Goal hierarchy / OKR model | missing or insufficient | BUILD |
| Persistent multi-step mission plan | partial | EXTEND after durable jobs/project memory |
| Sequential orchestration | partial | EXTEND |
| Parallel orchestration | Conductor fan-out exists | EXTEND |
| Handoff orchestration | partial | EXTEND |
| Supervisor/worker orchestration | static hierarchy exists | EXTEND |
| Plan-execute-judge loop | missing | BUILD |
| Independent Judge/QA | missing | BUILD |
| Repair/retry policy | partial infrastructure | EXTEND |
| Business Brain / canonical company graph | partial data exists | BUILD as composition over native data |
| Department/project/mission memory scopes | partial/backlog | EXTEND |
| Learning from outcomes | missing | BUILD |
| Proactive KPI/event triggers | partial analytics/jobs | EXTEND |
| Executive approval queue | partial patterns | EXTEND |
| Permissioned tool gateway | partial connectors/RBAC backlog | EXTEND |
| Cost/risk-aware model routing | routing exists | EXTEND |
| Organization Composer | missing | BUILD later |
| Agent Factory | missing | BUILD later |
| Browser/computer execution | partial external/local tools | DEFER until governance gates pass |

## 6. Skill gaps by executive role

These are not automatically 1:1 new SKILL.md files. First determine whether each should be a reusable skill, workflow, policy, or native service.

### Shared executive skills
- Goal decomposition
- Strategic planning
- KPI diagnosis
- Capability discovery
- Team composition
- Delegation and handoff
- Evidence synthesis
- Decision memo generation
- Risk scoring
- Plan revision
- Outcome evaluation
- Root-cause analysis
- Retrospective learning
- Approval preparation

### CEO-specific gaps
- Company strategy
- Portfolio prioritization
- Executive review
- Business health synthesis
- Scenario comparison

### CFO-specific gaps
- Budget planning
- Cash-flow forecasting
- Variance analysis
- Margin/profitability analysis
- Financial scenario modeling

### CMO-specific gaps
- Marketing strategy
- Campaign architecture
- Channel allocation
- Experiment design
- Marketing KPI diagnosis

### CRO-specific gaps
- Revenue forecasting
- Pipeline diagnosis
- Deal-risk scoring
- Lead-routing strategy
- Expansion/upsell planning

### COO-specific gaps
- Process bottleneck analysis
- Capacity planning
- SLA monitoring
- Workflow optimization
- Operating cadence management

### CTO-specific gaps
- Architecture review
- Change-risk analysis
- Reliability diagnosis
- Integration planning
- Technical roadmap prioritization

### Customer Success-specific gaps
- Account health scoring
- Churn-risk analysis
- Renewal planning
- Expansion signal detection
- Service escalation planning

## 7. Critical finding: runtime skill inventory is larger than GitHub inventory

Business OS intentionally supports three skill catalogs on `/skills`:

1. real user skills from an opt-in skills directory;
2. installed plugin skills from an opt-in plugin directory;
3. operator skills stored in the Business OS database.

GitHub proves the catalog mechanism and the 23 seeded operator skills, but it cannot prove the current contents of the host's `~/.claude/skills` or installed-plugin directories. SA-0 is therefore not fully closed until the running Business OS host exports those two live catalogs and the matrix is reconciled against them.

Required host-side evidence before SA-0 closure:
- total user-scope skills;
- total plugin skills;
- slug/name/description/group for each;
- duplicates/near-duplicates against the 23 operator skills;
- mapping to Super Agent roles;
- skills with unsafe write authority;
- skills requiring credentials or unavailable binaries;
- candidates to promote into the shared capability registry.

No private SKILL.md contents or credentials should be committed. Inventory metadata only unless a skill is explicitly approved for repository inclusion.

## 8. Recommended ownership model

Do not bind every skill permanently to one executive. Use capability tags plus permissions.

Example:

- `knowledge.retrieval`: shared by every Super Agent.
- `content.hook-writing`: CMO default, callable by CRO for sales campaigns.
- `sales.reply-qualification`: CRO default, callable by CMO campaign workflows.
- `finance.payment-reconciliation`: CFO default, callable by CRO for deal verification.
- `ops.inbox-triage`: Chief of Staff default, callable by Customer Success for client escalation.

This prevents departmental silos while preserving accountability.

## 9. SA-0 exit gate

SA-0 may be marked complete only when:

1. repository agents are fully inventoried;
2. repository operator skills are fully inventoried;
3. repository tools/connectors are fully inventoried;
4. live host user/plugin skill metadata is exported and reconciled;
5. every proposed Super Agent capability is classified REUSE, EXTEND, COMPOSE, PROMOTE TO SHARED, MISSING, or DEFER;
6. duplicate capabilities have an explicit consolidation decision;
7. no runtime implementation has started prematurely;
8. the final matrix is reviewed before SA-1 Universal SuperAgent Contract begins.

## Current conclusion

Business OS already contains much of the specialist workforce. The largest Super Agent gap is not raw task execution. It is executive-level planning, dynamic delegation, durable orchestration, shared capability discovery, governance, independent verification, and learning. The Super Agent program should turn the existing agents, skills, SOPs, workflows, tools, and business modules into a coordinated AI management system rather than replace them.