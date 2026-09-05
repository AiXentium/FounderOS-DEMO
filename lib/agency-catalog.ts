import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Agent } from '@/lib/schemas';
import type { RuntimeAgent } from '@/lib/agents/runtime';
import type { LlmToolSpec } from '@/lib/connectors/llm';
import { wordPressStatus } from '@/lib/connectors/wordpress';
import { runtimeEnv } from '@/lib/creds';
import { wordpressImportTool } from '@/lib/wordpress-import';
import { elementorBridgeTools, wordpressContentTools } from '@/lib/wordpress-tools';

type AgencyDefinition = { id: string; name: string; category: string; description: string; file: string };

// Railway does not initialize Git submodules, so keep a deployable manifest.
const AGENCY_MANIFEST: AgencyDefinition[] = [
  {
    "id": "agency-academic-anthropologist",
    "name": "Anthropologist",
    "category": "academic",
    "description": "Expert in cultural systems, rituals, kinship, belief systems, and ethnographic method — builds culturally coherent societies that feel lived-in rather than invented",
    "file": "academic/academic-anthropologist.md"
  },
  {
    "id": "agency-academic-geographer",
    "name": "Geographer",
    "category": "academic",
    "description": "Expert in physical and human geography, climate systems, cartography, and spatial analysis — builds geographically coherent worlds where terrain, climate, resources, and settlement patterns make scientific sense",
    "file": "academic/academic-geographer.md"
  },
  {
    "id": "agency-academic-historian",
    "name": "Historian",
    "category": "academic",
    "description": "Expert in historical analysis, periodization, material culture, and historiography — validates historical coherence and enriches settings with authentic period detail grounded in primary and secondary sources",
    "file": "academic/academic-historian.md"
  },
  {
    "id": "agency-academic-narratologist",
    "name": "Narratologist",
    "category": "academic",
    "description": "Expert in narrative theory, story structure, character arcs, and literary analysis — grounds advice in established frameworks from Propp to Campbell to modern narratology",
    "file": "academic/academic-narratologist.md"
  },
  {
    "id": "agency-academic-psychologist",
    "name": "Psychologist",
    "category": "academic",
    "description": "Expert in human behavior, personality theory, motivation, and cognitive patterns — builds psychologically credible characters and interactions grounded in clinical and research frameworks",
    "file": "academic/academic-psychologist.md"
  },
  {
    "id": "agency-accounts-payable-agent",
    "name": "Accounts Payable Agent",
    "category": "specialized",
    "description": "Autonomous payment processing specialist that executes vendor payments, contractor invoices, and recurring bills across any payment rail — crypto, fiat, stablecoins. Integrates with AI agent workflows via tool calls.",
    "file": "specialized/accounts-payable-agent.md"
  },
  {
    "id": "agency-agentic-identity-trust",
    "name": "Agentic Identity & Trust Architect",
    "category": "specialized",
    "description": "Designs identity, authentication, and trust verification systems for autonomous AI agents operating in multi-agent environments. Ensures agents can prove who they are, what they're authorized to do, and what they actually did.",
    "file": "specialized/agentic-identity-trust.md"
  },
  {
    "id": "agency-agents-orchestrator",
    "name": "Agents Orchestrator",
    "category": "specialized",
    "description": "Autonomous pipeline manager that orchestrates the entire development workflow. You are the leader of this process.",
    "file": "specialized/agents-orchestrator.md"
  },
  {
    "id": "agency-automation-governance-architect",
    "name": "Automation Governance Architect",
    "category": "specialized",
    "description": "Governance-first architect for business automations (n8n-first) who audits value, risk, and maintainability before implementation.",
    "file": "specialized/automation-governance-architect.md"
  },
  {
    "id": "agency-blender-addon-engineer",
    "name": "Blender Add-on Engineer",
    "category": "game-development",
    "description": "Blender tooling specialist - Builds Python add-ons, asset validators, exporters, and pipeline automations that turn repetitive DCC work into reliable one-click workflows",
    "file": "game-development/blender/blender-addon-engineer.md"
  },
  {
    "id": "agency-blockchain-security-auditor",
    "name": "Blockchain Security Auditor",
    "category": "specialized",
    "description": "Expert smart contract security auditor specializing in vulnerability detection, formal verification, exploit analysis, and comprehensive audit report writing for DeFi protocols and blockchain applications.",
    "file": "specialized/blockchain-security-auditor.md"
  },
  {
    "id": "agency-compliance-auditor",
    "name": "Compliance Auditor",
    "category": "specialized",
    "description": "Expert technical compliance auditor specializing in SOC 2, ISO 27001, HIPAA, and PCI-DSS audits — from readiness assessment through evidence collection to certification.",
    "file": "specialized/compliance-auditor.md"
  },
  {
    "id": "agency-corporate-training-designer",
    "name": "Corporate Training Designer",
    "category": "specialized",
    "description": "Expert in enterprise training system design and curriculum development — proficient in training needs analysis, instructional design methodology, blended learning program design, internal trainer development, leadership programs, and training effectiveness evaluation and continuous optimization.",
    "file": "specialized/corporate-training-designer.md"
  },
  {
    "id": "agency-customer-service",
    "name": "Customer Service",
    "category": "specialized",
    "description": "Friendly, professional customer service specialist for any industry — handling inquiries, complaints, account support, FAQs, and seamless escalation with warmth, efficiency, and a genuine commitment to customer satisfaction",
    "file": "specialized/customer-service.md"
  },
  {
    "id": "agency-data-consolidation-agent",
    "name": "Data Consolidation Agent",
    "category": "specialized",
    "description": "AI agent that consolidates extracted sales data into live reporting dashboards with territory, rep, and pipeline summaries",
    "file": "specialized/data-consolidation-agent.md"
  },
  {
    "id": "agency-design-brand-guardian",
    "name": "Brand Guardian",
    "category": "design",
    "description": "Expert brand strategist and guardian specializing in brand identity development, consistency maintenance, and strategic brand positioning",
    "file": "design/design-brand-guardian.md"
  },
  {
    "id": "agency-design-image-prompt-engineer",
    "name": "Image Prompt Engineer",
    "category": "design",
    "description": "Expert photography prompt engineer specializing in crafting detailed, evocative prompts for AI image generation. Masters the art of translating visual concepts into precise language that produces stunning, professional-quality photography through generative AI tools.",
    "file": "design/design-image-prompt-engineer.md"
  },
  {
    "id": "agency-design-inclusive-visuals-specialist",
    "name": "Inclusive Visuals Specialist",
    "category": "design",
    "description": "Representation expert who defeats systemic AI biases to generate culturally accurate, affirming, and non-stereotypical images and video.",
    "file": "design/design-inclusive-visuals-specialist.md"
  },
  {
    "id": "agency-design-ui-designer",
    "name": "UI Designer",
    "category": "design",
    "description": "Expert UI designer specializing in visual design systems, component libraries, and pixel-perfect interface creation. Creates beautiful, consistent, accessible user interfaces that enhance UX and reflect brand identity",
    "file": "design/design-ui-designer.md"
  },
  {
    "id": "agency-design-ux-architect",
    "name": "UX Architect",
    "category": "design",
    "description": "Technical architecture and UX specialist who provides developers with solid foundations, CSS systems, and clear implementation guidance",
    "file": "design/design-ux-architect.md"
  },
  {
    "id": "agency-design-ux-researcher",
    "name": "UX Researcher",
    "category": "design",
    "description": "Expert user experience researcher specializing in user behavior analysis, usability testing, and data-driven design insights. Provides actionable research findings that improve product usability and user satisfaction",
    "file": "design/design-ux-researcher.md"
  },
  {
    "id": "agency-design-visual-storyteller",
    "name": "Visual Storyteller",
    "category": "design",
    "description": "Expert visual communication specialist focused on creating compelling visual narratives, multimedia content, and brand storytelling through design. Specializes in transforming complex information into engaging visual stories that connect with audiences and drive emotional engagement.",
    "file": "design/design-visual-storyteller.md"
  },
  {
    "id": "agency-design-whimsy-injector",
    "name": "Whimsy Injector",
    "category": "design",
    "description": "Expert creative specialist focused on adding personality, delight, and playful elements to brand experiences. Creates memorable, joyful interactions that differentiate brands through unexpected moments of whimsy",
    "file": "design/design-whimsy-injector.md"
  },
  {
    "id": "agency-engineering-ai-data-remediation-engineer",
    "name": "AI Data Remediation Engineer",
    "category": "engineering",
    "description": "Specialist in self-healing data pipelines — uses air-gapped local SLMs and semantic clustering to automatically detect, classify, and fix data anomalies at scale. Focuses exclusively on the remediation layer: intercepting bad data, generating deterministic fix logic via Ollama, and guaranteeing zero data loss. Not a general data engineer — a surgical specialist for when your data is broken and the pipeline can't stop.",
    "file": "engineering/engineering-ai-data-remediation-engineer.md"
  },
  {
    "id": "agency-engineering-ai-engineer",
    "name": "AI Engineer",
    "category": "engineering",
    "description": "Expert AI/ML engineer specializing in machine learning model development, deployment, and integration into production systems. Focused on building intelligent features, data pipelines, and AI-powered applications with emphasis on practical, scalable solutions.",
    "file": "engineering/engineering-ai-engineer.md"
  },
  {
    "id": "agency-engineering-autonomous-optimization-architect",
    "name": "Autonomous Optimization Architect",
    "category": "engineering",
    "description": "Intelligent system governor that continuously shadow-tests APIs for performance while enforcing strict financial and security guardrails against runaway costs.",
    "file": "engineering/engineering-autonomous-optimization-architect.md"
  },
  {
    "id": "agency-engineering-backend-architect",
    "name": "Backend Architect",
    "category": "engineering",
    "description": "Senior backend architect specializing in scalable system design, database architecture, API development, and cloud infrastructure. Builds robust, secure, performant server-side applications and microservices",
    "file": "engineering/engineering-backend-architect.md"
  },
  {
    "id": "agency-engineering-cms-developer",
    "name": "CMS Developer",
    "category": "engineering",
    "description": "Drupal and WordPress specialist for theme development, custom plugins/modules, content architecture, and code-first CMS implementation",
    "file": "engineering/engineering-cms-developer.md"
  },
  {
    "id": "agency-engineering-code-reviewer",
    "name": "Code Reviewer",
    "category": "engineering",
    "description": "Expert code reviewer who provides constructive, actionable feedback focused on correctness, maintainability, security, and performance — not style preferences.",
    "file": "engineering/engineering-code-reviewer.md"
  },
  {
    "id": "agency-engineering-codebase-onboarding-engineer",
    "name": "Codebase Onboarding Engineer",
    "category": "engineering",
    "description": "Expert developer onboarding specialist who helps new engineers understand unfamiliar codebases fast by reading source code, tracing code paths, and stating only facts grounded in the code.",
    "file": "engineering/engineering-codebase-onboarding-engineer.md"
  },
  {
    "id": "agency-engineering-data-engineer",
    "name": "Data Engineer",
    "category": "engineering",
    "description": "Expert data engineer specializing in building reliable data pipelines, lakehouse architectures, and scalable data infrastructure. Masters ETL/ELT, Apache Spark, dbt, streaming systems, and cloud data platforms to turn raw data into trusted, analytics-ready assets.",
    "file": "engineering/engineering-data-engineer.md"
  },
  {
    "id": "agency-engineering-database-optimizer",
    "name": "Database Optimizer",
    "category": "engineering",
    "description": "Expert database specialist focusing on schema design, query optimization, indexing strategies, and performance tuning for PostgreSQL, MySQL, and modern databases like Supabase and PlanetScale.",
    "file": "engineering/engineering-database-optimizer.md"
  },
  {
    "id": "agency-engineering-devops-automator",
    "name": "DevOps Automator",
    "category": "engineering",
    "description": "Expert DevOps engineer specializing in infrastructure automation, CI/CD pipeline development, and cloud operations",
    "file": "engineering/engineering-devops-automator.md"
  },
  {
    "id": "agency-engineering-email-intelligence-engineer",
    "name": "Email Intelligence Engineer",
    "category": "engineering",
    "description": "Expert in extracting structured, reasoning-ready data from raw email threads for AI agents and automation systems",
    "file": "engineering/engineering-email-intelligence-engineer.md"
  },
  {
    "id": "agency-engineering-embedded-firmware-engineer",
    "name": "Embedded Firmware Engineer",
    "category": "engineering",
    "description": "Specialist in bare-metal and RTOS firmware - ESP32/ESP-IDF, PlatformIO, Arduino, ARM Cortex-M, STM32 HAL/LL, Nordic nRF5/nRF Connect SDK, FreeRTOS, Zephyr",
    "file": "engineering/engineering-embedded-firmware-engineer.md"
  },
  {
    "id": "agency-engineering-feishu-integration-developer",
    "name": "Feishu Integration Developer",
    "category": "engineering",
    "description": "Full-stack integration expert specializing in the Feishu (Lark) Open Platform — proficient in Feishu bots, mini programs, approval workflows, Bitable (multidimensional spreadsheets), interactive message cards, Webhooks, SSO authentication, and workflow automation, building enterprise-grade collaboration and automation solutions within the Feishu ecosystem.",
    "file": "engineering/engineering-feishu-integration-developer.md"
  },
  {
    "id": "agency-engineering-filament-optimization-specialist",
    "name": "Filament Optimization Specialist",
    "category": "engineering",
    "description": "Expert in restructuring and optimizing Filament PHP admin interfaces for maximum usability and efficiency. Focuses on impactful structural changes — not just cosmetic tweaks.",
    "file": "engineering/engineering-filament-optimization-specialist.md"
  },
  {
    "id": "agency-engineering-frontend-developer",
    "name": "Frontend Developer",
    "category": "engineering",
    "description": "Expert frontend developer specializing in modern web technologies, React/Vue/Angular frameworks, UI implementation, and performance optimization",
    "file": "engineering/engineering-frontend-developer.md"
  },
  {
    "id": "agency-engineering-git-workflow-master",
    "name": "Git Workflow Master",
    "category": "engineering",
    "description": "Expert in Git workflows, branching strategies, and version control best practices including conventional commits, rebasing, worktrees, and CI-friendly branch management.",
    "file": "engineering/engineering-git-workflow-master.md"
  },
  {
    "id": "agency-engineering-incident-response-commander",
    "name": "Incident Response Commander",
    "category": "engineering",
    "description": "Expert incident commander specializing in production incident management, structured response coordination, post-mortem facilitation, SLO/SLI tracking, and on-call process design for reliable engineering organizations.",
    "file": "engineering/engineering-incident-response-commander.md"
  },
  {
    "id": "agency-engineering-minimal-change-engineer",
    "name": "Minimal Change Engineer",
    "category": "engineering",
    "description": "Engineering specialist focused on minimum-viable diffs — fixes only what was asked, refuses scope creep, prefers three similar lines over a premature abstraction. The discipline that prevents bug-fix PRs from becoming refactor avalanches.",
    "file": "engineering/engineering-minimal-change-engineer.md"
  },
  {
    "id": "agency-engineering-mobile-app-builder",
    "name": "Mobile App Builder",
    "category": "engineering",
    "description": "Specialized mobile application developer with expertise in native iOS/Android development and cross-platform frameworks",
    "file": "engineering/engineering-mobile-app-builder.md"
  },
  {
    "id": "agency-engineering-rapid-prototyper",
    "name": "Rapid Prototyper",
    "category": "engineering",
    "description": "Specialized in ultra-fast proof-of-concept development and MVP creation using efficient tools and frameworks",
    "file": "engineering/engineering-rapid-prototyper.md"
  },
  {
    "id": "agency-engineering-security-engineer",
    "name": "Security Engineer",
    "category": "engineering",
    "description": "Expert application security engineer specializing in threat modeling, vulnerability assessment, secure code review, security architecture design, and incident response for modern web, API, and cloud-native applications.",
    "file": "engineering/engineering-security-engineer.md"
  },
  {
    "id": "agency-engineering-senior-developer",
    "name": "Senior Developer",
    "category": "engineering",
    "description": "Premium implementation specialist - Masters Laravel/Livewire/FluxUI, advanced CSS, Three.js integration",
    "file": "engineering/engineering-senior-developer.md"
  },
  {
    "id": "agency-engineering-software-architect",
    "name": "Software Architect",
    "category": "engineering",
    "description": "Expert software architect specializing in system design, domain-driven design, architectural patterns, and technical decision-making for scalable, maintainable systems.",
    "file": "engineering/engineering-software-architect.md"
  },
  {
    "id": "agency-engineering-solidity-smart-contract-engineer",
    "name": "Solidity Smart Contract Engineer",
    "category": "engineering",
    "description": "Expert Solidity developer specializing in EVM smart contract architecture, gas optimization, upgradeable proxy patterns, DeFi protocol development, and security-first contract design across Ethereum and L2 chains.",
    "file": "engineering/engineering-solidity-smart-contract-engineer.md"
  },
  {
    "id": "agency-engineering-sre",
    "name": "SRE (Site Reliability Engineer)",
    "category": "engineering",
    "description": "Expert site reliability engineer specializing in SLOs, error budgets, observability, chaos engineering, and toil reduction for production systems at scale.",
    "file": "engineering/engineering-sre.md"
  },
  {
    "id": "agency-engineering-technical-writer",
    "name": "Technical Writer",
    "category": "engineering",
    "description": "Expert technical writer specializing in developer documentation, API references, README files, and tutorials. Transforms complex engineering concepts into clear, accurate, and engaging docs that developers actually read and use.",
    "file": "engineering/engineering-technical-writer.md"
  },
  {
    "id": "agency-engineering-threat-detection-engineer",
    "name": "Threat Detection Engineer",
    "category": "engineering",
    "description": "Expert detection engineer specializing in SIEM rule development, MITRE ATT&CK coverage mapping, threat hunting, alert tuning, and detection-as-code pipelines for security operations teams.",
    "file": "engineering/engineering-threat-detection-engineer.md"
  },
  {
    "id": "agency-engineering-voice-ai-integration-engineer",
    "name": "Voice AI Integration Engineer",
    "category": "engineering",
    "description": "Expert in building end-to-end speech transcription pipelines using Whisper-style models and cloud ASR services — from raw audio ingestion through preprocessing, transcript cleanup, subtitle generation, speaker diarization, and structured downstream integration into apps, APIs, and CMS platforms.",
    "file": "engineering/engineering-voice-ai-integration-engineer.md"
  },
  {
    "id": "agency-engineering-wechat-mini-program-developer",
    "name": "WeChat Mini Program Developer",
    "category": "engineering",
    "description": "Expert WeChat Mini Program developer specializing in 小程序 development with WXML/WXSS/WXS, WeChat API integration, payment systems, subscription messaging, and the full WeChat ecosystem.",
    "file": "engineering/engineering-wechat-mini-program-developer.md"
  },
  {
    "id": "agency-finance-bookkeeper-controller",
    "name": "Bookkeeper & Controller",
    "category": "finance",
    "description": "Expert bookkeeper and controller specializing in day-to-day accounting operations, financial reconciliations, month-end close processes, and internal controls. Ensures the accuracy, completeness, and timeliness of financial records while maintaining GAAP compliance and audit readiness at all times.",
    "file": "finance/finance-bookkeeper-controller.md"
  },
  {
    "id": "agency-finance-financial-analyst",
    "name": "Financial Analyst",
    "category": "finance",
    "description": "Expert financial analyst specializing in financial modeling, forecasting, scenario analysis, and data-driven decision support. Transforms raw financial data into actionable business intelligence that drives strategic planning, investment decisions, and operational optimization.",
    "file": "finance/finance-financial-analyst.md"
  },
  {
    "id": "agency-finance-fpa-analyst",
    "name": "FP&A Analyst",
    "category": "finance",
    "description": "Expert Financial Planning & Analysis (FP&A) analyst specializing in budgeting, variance analysis, financial planning, rolling forecasts, and strategic decision support. Bridges the gap between the numbers and the business narrative to drive operational performance and strategic resource allocation.",
    "file": "finance/finance-fpa-analyst.md"
  },
  {
    "id": "agency-finance-investment-researcher",
    "name": "Investment Researcher",
    "category": "finance",
    "description": "Expert investment researcher specializing in market research, due diligence, portfolio analysis, and asset valuation. Conducts rigorous fundamental and quantitative analysis to identify investment opportunities, assess risks, and support data-driven portfolio decisions across public equities, private markets, and alternative assets.",
    "file": "finance/finance-investment-researcher.md"
  },
  {
    "id": "agency-finance-tax-strategist",
    "name": "Tax Strategist",
    "category": "finance",
    "description": "Expert tax strategist specializing in tax optimization, multi-jurisdictional compliance, transfer pricing, and strategic tax planning. Navigates complex tax codes to minimize liability while ensuring full regulatory compliance across local, state, federal, and international tax regimes.",
    "file": "finance/finance-tax-strategist.md"
  },
  {
    "id": "agency-game-audio-engineer",
    "name": "Game Audio Engineer",
    "category": "game-development",
    "description": "Interactive audio specialist - Masters FMOD/Wwise integration, adaptive music systems, spatial audio, and audio performance budgeting across all game engines",
    "file": "game-development/game-audio-engineer.md"
  },
  {
    "id": "agency-game-designer",
    "name": "Game Designer",
    "category": "game-development",
    "description": "Systems and mechanics architect - Masters GDD authorship, player psychology, economy balancing, and gameplay loop design across all engines and genres",
    "file": "game-development/game-designer.md"
  },
  {
    "id": "agency-godot-gameplay-scripter",
    "name": "Godot Gameplay Scripter",
    "category": "game-development",
    "description": "Composition and signal integrity specialist - Masters GDScript 2.0, C# integration, node-based architecture, and type-safe signal design for Godot 4 projects",
    "file": "game-development/godot/godot-gameplay-scripter.md"
  },
  {
    "id": "agency-godot-multiplayer-engineer",
    "name": "Godot Multiplayer Engineer",
    "category": "game-development",
    "description": "Godot 4 networking specialist - Masters the MultiplayerAPI, scene replication, ENet/WebRTC transport, RPCs, and authority models for real-time multiplayer games",
    "file": "game-development/godot/godot-multiplayer-engineer.md"
  },
  {
    "id": "agency-godot-shader-developer",
    "name": "Godot Shader Developer",
    "category": "game-development",
    "description": "Godot 4 visual effects specialist - Masters the Godot Shading Language (GLSL-like), VisualShader editor, CanvasItem and Spatial shaders, post-processing, and performance optimization for 2D/3D effects",
    "file": "game-development/godot/godot-shader-developer.md"
  },
  {
    "id": "agency-government-digital-presales-consultant",
    "name": "Government Digital Presales Consultant",
    "category": "specialized",
    "description": "Presales expert for China's government digital transformation market (ToG), proficient in policy interpretation, solution design, bid document preparation, POC validation, compliance requirements (classified protection/cryptographic assessment/Xinchuang domestic IT), and stakeholder management — helping technical teams efficiently win government IT projects.",
    "file": "specialized/government-digital-presales-consultant.md"
  },
  {
    "id": "agency-healthcare-customer-service",
    "name": "Healthcare Customer Service",
    "category": "specialized",
    "description": "Empathetic healthcare customer service specialist for patient support, billing inquiries, appointment management, insurance questions, complaint resolution, and seamless escalation to clinical or administrative staff",
    "file": "specialized/healthcare-customer-service.md"
  },
  {
    "id": "agency-healthcare-marketing-compliance",
    "name": "Healthcare Marketing Compliance Specialist",
    "category": "specialized",
    "description": "Expert in healthcare marketing compliance in China, proficient in the Advertising Law, Medical Advertisement Management Measures, Drug Administration Law, and related regulations — covering pharmaceuticals, medical devices, medical aesthetics, health supplements, and internet healthcare across content review, risk control, platform rule interpretation, and patient privacy protection, helping enterprises conduct effective health marketing within legal boundaries.",
    "file": "specialized/healthcare-marketing-compliance.md"
  },
  {
    "id": "agency-hospitality-guest-services",
    "name": "Hospitality Guest Services",
    "category": "specialized",
    "description": "Comprehensive hospitality guest services specialist for hotels, resorts, restaurants, and event venues — covering reservations, check-in/check-out, concierge services, guest complaint resolution, loyalty program management, and post-stay follow-up to deliver exceptional guest experiences that drive loyalty and revenue",
    "file": "specialized/hospitality-guest-services.md"
  },
  {
    "id": "agency-hr-onboarding",
    "name": "HR Onboarding",
    "category": "specialized",
    "description": "Comprehensive HR onboarding specialist for employee orientation, documentation management, compliance tracking, benefits enrollment, culture integration, and new hire support — delivering a seamless first-day-to-first-year experience that drives retention and productivity",
    "file": "specialized/hr-onboarding.md"
  },
  {
    "id": "agency-identity-graph-operator",
    "name": "Identity Graph Operator",
    "category": "specialized",
    "description": "Operates a shared identity graph that multiple AI agents resolve against. Ensures every agent in a multi-agent system gets the same canonical answer for \"who is this entity?\" - deterministically, even under concurrent writes.",
    "file": "specialized/identity-graph-operator.md"
  },
  {
    "id": "agency-language-translator",
    "name": "Language Translator",
    "category": "specialized",
    "description": "Real-time Spanish ↔ English translation specialist with cultural context, regional dialect awareness, travel phrase guidance, and tone-appropriate communication for everyday, business, and emergency situations",
    "file": "specialized/language-translator.md"
  },
  {
    "id": "agency-legal-billing-time-tracking",
    "name": "Legal Billing & Time Tracking",
    "category": "specialized",
    "description": "Comprehensive legal billing and time tracking specialist for accurate time capture, invoice generation, billing narrative writing, collections management, trust account compliance, and billing analysis — maximizing revenue recovery while maintaining client relationships and ethical compliance across any firm size or billing model",
    "file": "specialized/legal-billing-time-tracking.md"
  },
  {
    "id": "agency-legal-client-intake",
    "name": "Legal Client Intake",
    "category": "specialized",
    "description": "Comprehensive legal client intake specialist for qualifying prospects, collecting case information, scheduling consultations, managing conflict checks, and delivering attorney-ready intake summaries across any practice area and firm size",
    "file": "specialized/legal-client-intake.md"
  },
  {
    "id": "agency-legal-document-review",
    "name": "Legal Document Review",
    "category": "specialized",
    "description": "Comprehensive legal document review specialist for contracts, litigation documents, and real estate agreements — summarizing documents, flagging risk clauses, comparing contract versions, and checking compliance across any law firm size or practice area",
    "file": "specialized/legal-document-review.md"
  },
  {
    "id": "agency-level-designer",
    "name": "Level Designer",
    "category": "game-development",
    "description": "Spatial storytelling and flow specialist - Masters layout theory, pacing architecture, encounter design, and environmental narrative across all game engines",
    "file": "game-development/level-designer.md"
  },
  {
    "id": "agency-loan-officer-assistant",
    "name": "Loan Officer Assistant",
    "category": "specialized",
    "description": "Comprehensive loan officer assistant for mortgage and lending professionals — covering borrower intake, pre-qualification, document collection, pipeline management, compliance tracking, rate quoting, and closing coordination across residential, commercial, and consumer lending",
    "file": "specialized/loan-officer-assistant.md"
  },
  {
    "id": "agency-lsp-index-engineer",
    "name": "LSP/Index Engineer",
    "category": "specialized",
    "description": "Language Server Protocol specialist building unified code intelligence systems through LSP client orchestration and semantic indexing",
    "file": "specialized/lsp-index-engineer.md"
  },
  {
    "id": "agency-macos-spatial-metal-engineer",
    "name": "macOS Spatial/Metal Engineer",
    "category": "spatial-computing",
    "description": "Native Swift and Metal specialist building high-performance 3D rendering systems and spatial computing experiences for macOS and Vision Pro",
    "file": "spatial-computing/macos-spatial-metal-engineer.md"
  },
  {
    "id": "agency-marketing-agentic-search-optimizer",
    "name": "Agentic Search Optimizer",
    "category": "marketing",
    "description": "Expert in WebMCP readiness and agentic task completion — audits whether AI agents can actually accomplish tasks on your site (book, buy, register, subscribe), implements WebMCP declarative and imperative patterns, and measures task completion rates across AI browsing agents",
    "file": "marketing/marketing-agentic-search-optimizer.md"
  },
  {
    "id": "agency-marketing-ai-citation-strategist",
    "name": "AI Citation Strategist",
    "category": "marketing",
    "description": "Expert in AI recommendation engine optimization (AEO/GEO) — audits brand visibility across ChatGPT, Claude, Gemini, and Perplexity, identifies why competitors get cited instead, and delivers content fixes that improve AI citations",
    "file": "marketing/marketing-ai-citation-strategist.md"
  },
  {
    "id": "agency-marketing-app-store-optimizer",
    "name": "App Store Optimizer",
    "category": "marketing",
    "description": "Expert app store marketing specialist focused on App Store Optimization (ASO), conversion rate optimization, and app discoverability",
    "file": "marketing/marketing-app-store-optimizer.md"
  },
  {
    "id": "agency-marketing-baidu-seo-specialist",
    "name": "Baidu SEO Specialist",
    "category": "marketing",
    "description": "Expert Baidu search optimization specialist focused on Chinese search engine ranking, Baidu ecosystem integration, ICP compliance, Chinese keyword research, and mobile-first indexing for the China market.",
    "file": "marketing/marketing-baidu-seo-specialist.md"
  },
  {
    "id": "agency-marketing-bilibili-content-strategist",
    "name": "Bilibili Content Strategist",
    "category": "marketing",
    "description": "Expert Bilibili marketing specialist focused on UP主 growth, danmaku culture mastery, B站 algorithm optimization, community building, and branded content strategy for China's leading video community platform.",
    "file": "marketing/marketing-bilibili-content-strategist.md"
  },
  {
    "id": "agency-marketing-book-co-author",
    "name": "Book Co-Author",
    "category": "marketing",
    "description": "Strategic thought-leadership book collaborator for founders, experts, and operators turning voice notes, fragments, and positioning into structured first-person chapters.",
    "file": "marketing/marketing-book-co-author.md"
  },
  {
    "id": "agency-marketing-carousel-growth-engine",
    "name": "Carousel Growth Engine",
    "category": "marketing",
    "description": "Autonomous TikTok and Instagram carousel generation specialist. Analyzes any website URL with Playwright, generates viral 6-slide carousels via Gemini image generation, publishes directly to feed via Upload-Post API with auto trending music, fetches analytics, and iteratively improves through a data-driven learning loop.",
    "file": "marketing/marketing-carousel-growth-engine.md"
  },
  {
    "id": "agency-marketing-china-ecommerce-operator",
    "name": "China E-Commerce Operator",
    "category": "marketing",
    "description": "Expert China e-commerce operations specialist covering Taobao, Tmall, Pinduoduo, and JD ecosystems with deep expertise in product listing optimization, live commerce, store operations, 618/Double 11 campaigns, and cross-platform strategy.",
    "file": "marketing/marketing-china-ecommerce-operator.md"
  },
  {
    "id": "agency-marketing-china-market-localization-strategist",
    "name": "China Market Localization Strategist",
    "category": "marketing",
    "description": "Full-stack China market localization expert who transforms real-time trend signals into executable go-to-market strategies across Douyin, Xiaohongshu, WeChat, Bilibili, and beyond",
    "file": "marketing/marketing-china-market-localization-strategist.md"
  },
  {
    "id": "agency-marketing-content-creator",
    "name": "Content Creator",
    "category": "marketing",
    "description": "Expert content strategist and creator for multi-platform campaigns. Develops editorial calendars, creates compelling copy, manages brand storytelling, and optimizes content for engagement across all digital channels.",
    "file": "marketing/marketing-content-creator.md"
  },
  {
    "id": "agency-marketing-cross-border-ecommerce",
    "name": "Cross-Border E-Commerce Specialist",
    "category": "marketing",
    "description": "Full-funnel cross-border e-commerce strategist covering Amazon, Shopee, Lazada, AliExpress, Temu, and TikTok Shop operations, international logistics and overseas warehousing, compliance and taxation, multilingual listing optimization, brand globalization, and DTC independent site development.",
    "file": "marketing/marketing-cross-border-ecommerce.md"
  },
  {
    "id": "agency-marketing-douyin-strategist",
    "name": "Douyin Strategist",
    "category": "marketing",
    "description": "Short-video marketing expert specializing in the Douyin platform, with deep expertise in recommendation algorithm mechanics, viral video planning, livestream commerce workflows, and full-funnel brand growth through content matrix strategies.",
    "file": "marketing/marketing-douyin-strategist.md"
  },
  {
    "id": "agency-marketing-growth-hacker",
    "name": "Growth Hacker",
    "category": "marketing",
    "description": "Expert growth strategist specializing in rapid user acquisition through data-driven experimentation. Develops viral loops, optimizes conversion funnels, and finds scalable growth channels for exponential business growth.",
    "file": "marketing/marketing-growth-hacker.md"
  },
  {
    "id": "agency-marketing-instagram-curator",
    "name": "Instagram Curator",
    "category": "marketing",
    "description": "Expert Instagram marketing specialist focused on visual storytelling, community building, and multi-format content optimization. Masters aesthetic development and drives meaningful engagement.",
    "file": "marketing/marketing-instagram-curator.md"
  },
  {
    "id": "agency-marketing-kuaishou-strategist",
    "name": "Kuaishou Strategist",
    "category": "marketing",
    "description": "Expert Kuaishou marketing strategist specializing in short-video content for China's lower-tier city markets, live commerce operations, community trust building, and grassroots audience growth on 快手.",
    "file": "marketing/marketing-kuaishou-strategist.md"
  },
  {
    "id": "agency-marketing-linkedin-content-creator",
    "name": "LinkedIn Content Creator",
    "category": "marketing",
    "description": "Expert LinkedIn content strategist focused on thought leadership, personal brand building, and high-engagement professional content. Masters LinkedIn's algorithm and culture to drive inbound opportunities for founders, job seekers, developers, and anyone building a professional presence.",
    "file": "marketing/marketing-linkedin-content-creator.md"
  },
  {
    "id": "agency-marketing-livestream-commerce-coach",
    "name": "Livestream Commerce Coach",
    "category": "marketing",
    "description": "Veteran livestream e-commerce coach specializing in host training and live room operations across Douyin, Kuaishou, Taobao Live, and Channels, covering script design, product sequencing, paid-vs-organic traffic balancing, conversion closing techniques, and real-time data-driven optimization.",
    "file": "marketing/marketing-livestream-commerce-coach.md"
  },
  {
    "id": "agency-marketing-podcast-strategist",
    "name": "Podcast Strategist",
    "category": "marketing",
    "description": "Content strategy and operations expert for the Chinese podcast market, with deep expertise in Xiaoyuzhou, Ximalaya, and other major audio platforms, covering show positioning, audio production, audience growth, multi-platform distribution, and monetization to help podcast creators build sticky audio content brands.",
    "file": "marketing/marketing-podcast-strategist.md"
  },
  {
    "id": "agency-marketing-private-domain-operator",
    "name": "Private Domain Operator",
    "category": "marketing",
    "description": "Expert in building enterprise WeChat (WeCom) private domain ecosystems, with deep expertise in SCRM systems, segmented community operations, Mini Program commerce integration, user lifecycle management, and full-funnel conversion optimization.",
    "file": "marketing/marketing-private-domain-operator.md"
  },
  {
    "id": "agency-marketing-reddit-community-builder",
    "name": "Reddit Community Builder",
    "category": "marketing",
    "description": "Expert Reddit marketing specialist focused on authentic community engagement, value-driven content creation, and long-term relationship building. Masters Reddit culture navigation.",
    "file": "marketing/marketing-reddit-community-builder.md"
  },
  {
    "id": "agency-marketing-seo-specialist",
    "name": "SEO Specialist",
    "category": "marketing",
    "description": "Expert search engine optimization strategist specializing in technical SEO, content optimization, link authority building, and organic search growth. Drives sustainable traffic through data-driven search strategies.",
    "file": "marketing/marketing-seo-specialist.md"
  },
  {
    "id": "agency-marketing-short-video-editing-coach",
    "name": "Short-Video Editing Coach",
    "category": "marketing",
    "description": "Hands-on short-video editing coach covering the full post-production pipeline, with mastery of CapCut Pro, Premiere Pro, DaVinci Resolve, and Final Cut Pro across composition and camera language, color grading, audio engineering, motion graphics and VFX, subtitle design, multi-platform export optimization, editing workflow efficiency, and AI-assisted editing.",
    "file": "marketing/marketing-short-video-editing-coach.md"
  },
  {
    "id": "agency-marketing-social-media-strategist",
    "name": "Social Media Strategist",
    "category": "marketing",
    "description": "Expert social media strategist for LinkedIn, Twitter, and professional platforms. Creates cross-platform campaigns, builds communities, manages real-time engagement, and develops thought leadership strategies.",
    "file": "marketing/marketing-social-media-strategist.md"
  },
  {
    "id": "agency-marketing-tiktok-strategist",
    "name": "TikTok Strategist",
    "category": "marketing",
    "description": "Expert TikTok marketing specialist focused on viral content creation, algorithm optimization, and community building. Masters TikTok's unique culture and features for brand growth.",
    "file": "marketing/marketing-tiktok-strategist.md"
  },
  {
    "id": "agency-marketing-twitter-engager",
    "name": "Twitter Engager",
    "category": "marketing",
    "description": "Expert Twitter marketing specialist focused on real-time engagement, thought leadership building, and community-driven growth. Builds brand authority through authentic conversation participation and viral thread creation.",
    "file": "marketing/marketing-twitter-engager.md"
  },
  {
    "id": "agency-marketing-video-optimization-specialist",
    "name": "Video Optimization Specialist",
    "category": "marketing",
    "description": "Video marketing strategist specializing in YouTube algorithm optimization, audience retention, chaptering, thumbnail concepts, and cross-platform video syndication.",
    "file": "marketing/marketing-video-optimization-specialist.md"
  },
  {
    "id": "agency-marketing-wechat-official-account",
    "name": "WeChat Official Account Manager",
    "category": "marketing",
    "description": "Expert WeChat Official Account (OA) strategist specializing in content marketing, subscriber engagement, and conversion optimization. Masters multi-format content and builds loyal communities through consistent value delivery.",
    "file": "marketing/marketing-wechat-official-account.md"
  },
  {
    "id": "agency-marketing-weibo-strategist",
    "name": "Weibo Strategist",
    "category": "marketing",
    "description": "Full-spectrum operations expert for Sina Weibo, with deep expertise in trending topic mechanics, Super Topic community management, public sentiment monitoring, fan economy strategies, and Weibo advertising, helping brands achieve viral reach and sustained growth on China's leading public discourse platform.",
    "file": "marketing/marketing-weibo-strategist.md"
  },
  {
    "id": "agency-marketing-xiaohongshu-specialist",
    "name": "Xiaohongshu Specialist",
    "category": "marketing",
    "description": "Expert Xiaohongshu marketing specialist focused on lifestyle content, trend-driven strategies, and authentic community engagement. Masters micro-content creation and drives viral growth through aesthetic storytelling.",
    "file": "marketing/marketing-xiaohongshu-specialist.md"
  },
  {
    "id": "agency-marketing-zhihu-strategist",
    "name": "Zhihu Strategist",
    "category": "marketing",
    "description": "Expert Zhihu marketing specialist focused on thought leadership, community credibility, and knowledge-driven engagement. Masters question-answering strategy and builds brand authority through authentic expertise sharing.",
    "file": "marketing/marketing-zhihu-strategist.md"
  },
  {
    "id": "agency-narrative-designer",
    "name": "Narrative Designer",
    "category": "game-development",
    "description": "Story systems and dialogue architect - Masters GDD-aligned narrative design, branching dialogue, lore architecture, and environmental storytelling across all game engines",
    "file": "game-development/narrative-designer.md"
  },
  {
    "id": "agency-paid-media-auditor",
    "name": "Paid Media Auditor",
    "category": "paid-media",
    "description": "Comprehensive paid media auditor who systematically evaluates Google Ads, Microsoft Ads, and Meta accounts across 200+ checkpoints spanning account structure, tracking, bidding, creative, audiences, and competitive positioning. Produces actionable audit reports with prioritized recommendations and projected impact.",
    "file": "paid-media/paid-media-auditor.md"
  },
  {
    "id": "agency-paid-media-creative-strategist",
    "name": "Ad Creative Strategist",
    "category": "paid-media",
    "description": "Paid media creative specialist focused on ad copywriting, RSA optimization, asset group design, and creative testing frameworks across Google, Meta, Microsoft, and programmatic platforms. Bridges the gap between performance data and persuasive messaging.",
    "file": "paid-media/paid-media-creative-strategist.md"
  },
  {
    "id": "agency-paid-media-paid-social-strategist",
    "name": "Paid Social Strategist",
    "category": "paid-media",
    "description": "Cross-platform paid social advertising specialist covering Meta (Facebook/Instagram), LinkedIn, TikTok, Pinterest, X, and Snapchat. Designs full-funnel social ad programs from prospecting through retargeting with platform-specific creative and audience strategies.",
    "file": "paid-media/paid-media-paid-social-strategist.md"
  },
  {
    "id": "agency-paid-media-ppc-strategist",
    "name": "PPC Campaign Strategist",
    "category": "paid-media",
    "description": "Senior paid media strategist specializing in large-scale search, shopping, and performance max campaign architecture across Google, Microsoft, and Amazon ad platforms. Designs account structures, budget allocation frameworks, and bidding strategies that scale from $10K to $10M+ monthly spend.",
    "file": "paid-media/paid-media-ppc-strategist.md"
  },
  {
    "id": "agency-paid-media-programmatic-buyer",
    "name": "Programmatic & Display Buyer",
    "category": "paid-media",
    "description": "Display advertising and programmatic media buying specialist covering managed placements, Google Display Network, DV360, trade desk platforms, partner media (newsletters, sponsored content), and ABM display strategies via platforms like Demandbase and 6Sense.",
    "file": "paid-media/paid-media-programmatic-buyer.md"
  },
  {
    "id": "agency-paid-media-search-query-analyst",
    "name": "Search Query Analyst",
    "category": "paid-media",
    "description": "Specialist in search term analysis, negative keyword architecture, and query-to-intent mapping. Turns raw search query data into actionable optimizations that eliminate waste and amplify high-intent traffic across paid search accounts.",
    "file": "paid-media/paid-media-search-query-analyst.md"
  },
  {
    "id": "agency-paid-media-tracking-specialist",
    "name": "Tracking & Measurement Specialist",
    "category": "paid-media",
    "description": "Expert in conversion tracking architecture, tag management, and attribution modeling across Google Tag Manager, GA4, Google Ads, Meta CAPI, LinkedIn Insight Tag, and server-side implementations. Ensures every conversion is counted correctly and every dollar of ad spend is measurable.",
    "file": "paid-media/paid-media-tracking-specialist.md"
  },
  {
    "id": "agency-product-behavioral-nudge-engine",
    "name": "Behavioral Nudge Engine",
    "category": "product",
    "description": "Behavioral psychology specialist that adapts software interaction cadences and styles to maximize user motivation and success.",
    "file": "product/product-behavioral-nudge-engine.md"
  },
  {
    "id": "agency-product-feedback-synthesizer",
    "name": "Feedback Synthesizer",
    "category": "product",
    "description": "Expert in collecting, analyzing, and synthesizing user feedback from multiple channels to extract actionable product insights. Transforms qualitative feedback into quantitative priorities and strategic recommendations.",
    "file": "product/product-feedback-synthesizer.md"
  },
  {
    "id": "agency-product-manager",
    "name": "Product Manager",
    "category": "product",
    "description": "Holistic product leader who owns the full product lifecycle — from discovery and strategy through roadmap, stakeholder alignment, go-to-market, and outcome measurement. Bridges business goals, user needs, and technical reality to ship the right thing at the right time.",
    "file": "product/product-manager.md"
  },
  {
    "id": "agency-product-sprint-prioritizer",
    "name": "Sprint Prioritizer",
    "category": "product",
    "description": "Expert product manager specializing in agile sprint planning, feature prioritization, and resource allocation. Focused on maximizing team velocity and business value delivery through data-driven prioritization frameworks.",
    "file": "product/product-sprint-prioritizer.md"
  },
  {
    "id": "agency-product-trend-researcher",
    "name": "Trend Researcher",
    "category": "product",
    "description": "Expert market intelligence analyst specializing in identifying emerging trends, competitive analysis, and opportunity assessment. Focused on providing actionable insights that drive product strategy and innovation decisions.",
    "file": "product/product-trend-researcher.md"
  },
  {
    "id": "agency-project-management-experiment-tracker",
    "name": "Experiment Tracker",
    "category": "project-management",
    "description": "Expert project manager specializing in experiment design, execution tracking, and data-driven decision making. Focused on managing A/B tests, feature experiments, and hypothesis validation through systematic experimentation and rigorous analysis.",
    "file": "project-management/project-management-experiment-tracker.md"
  },
  {
    "id": "agency-project-management-jira-workflow-steward",
    "name": "Jira Workflow Steward",
    "category": "project-management",
    "description": "Expert delivery operations specialist who enforces Jira-linked Git workflows, traceable commits, structured pull requests, and release-safe branch strategy across software teams.",
    "file": "project-management/project-management-jira-workflow-steward.md"
  },
  {
    "id": "agency-project-management-project-shepherd",
    "name": "Project Shepherd",
    "category": "project-management",
    "description": "Expert project manager specializing in cross-functional project coordination, timeline management, and stakeholder alignment. Focused on shepherding projects from conception to completion while managing resources, risks, and communications across multiple teams and departments.",
    "file": "project-management/project-management-project-shepherd.md"
  },
  {
    "id": "agency-project-management-studio-operations",
    "name": "Studio Operations",
    "category": "project-management",
    "description": "Expert operations manager specializing in day-to-day studio efficiency, process optimization, and resource coordination. Focused on ensuring smooth operations, maintaining productivity standards, and supporting all teams with the tools and processes needed for success.",
    "file": "project-management/project-management-studio-operations.md"
  },
  {
    "id": "agency-project-management-studio-producer",
    "name": "Studio Producer",
    "category": "project-management",
    "description": "Senior strategic leader specializing in high-level creative and technical project orchestration, resource allocation, and multi-project portfolio management. Focused on aligning creative vision with business objectives while managing complex cross-functional initiatives and ensuring optimal studio operations.",
    "file": "project-management/project-management-studio-producer.md"
  },
  {
    "id": "agency-project-manager-senior",
    "name": "Senior Project Manager",
    "category": "project-management",
    "description": "Converts specs to tasks and remembers previous projects. Focused on realistic scope, no background processes, exact spec requirements",
    "file": "project-management/project-manager-senior.md"
  },
  {
    "id": "agency-real-estate-buyer-seller",
    "name": "Real Estate Buyer & Seller",
    "category": "specialized",
    "description": "Comprehensive real estate agent assistant for buyer representation, seller representation, listing management, offer negotiation, transaction coordination, and closing support — delivering a world-class client experience from first showing to final closing across residential and investment real estate",
    "file": "specialized/real-estate-buyer-seller.md"
  },
  {
    "id": "agency-recruitment-specialist",
    "name": "Recruitment Specialist",
    "category": "specialized",
    "description": "Expert recruitment operations and talent acquisition specialist — skilled in China's major hiring platforms, talent assessment frameworks, and labor law compliance. Helps companies efficiently attract, screen, and retain top talent while building a competitive employer brand.",
    "file": "specialized/recruitment-specialist.md"
  },
  {
    "id": "agency-report-distribution-agent",
    "name": "Report Distribution Agent",
    "category": "specialized",
    "description": "AI agent that automates distribution of consolidated sales reports to representatives based on territorial parameters",
    "file": "specialized/report-distribution-agent.md"
  },
  {
    "id": "agency-retail-customer-returns",
    "name": "Retail Customer Returns",
    "category": "specialized",
    "description": "Comprehensive retail customer returns specialist for processing returns, exchanges, and refunds across in-store, online, and omnichannel retail — handling policy enforcement, fraud prevention, customer retention, vendor returns, and returns analytics to maximize recovery while preserving customer loyalty",
    "file": "specialized/retail-customer-returns.md"
  },
  {
    "id": "agency-roblox-avatar-creator",
    "name": "Roblox Avatar Creator",
    "category": "game-development",
    "description": "Roblox UGC and avatar pipeline specialist - Masters Roblox's avatar system, UGC item creation, accessory rigging, texture standards, and the Creator Marketplace submission pipeline",
    "file": "game-development/roblox-studio/roblox-avatar-creator.md"
  },
  {
    "id": "agency-roblox-experience-designer",
    "name": "Roblox Experience Designer",
    "category": "game-development",
    "description": "Roblox platform UX and monetization specialist - Masters engagement loop design, DataStore-driven progression, Roblox monetization systems (Passes, Developer Products, UGC), and player retention for Roblox experiences",
    "file": "game-development/roblox-studio/roblox-experience-designer.md"
  },
  {
    "id": "agency-roblox-systems-scripter",
    "name": "Roblox Systems Scripter",
    "category": "game-development",
    "description": "Roblox platform engineering specialist - Masters Luau, the client-server security model, RemoteEvents/RemoteFunctions, DataStore, and module architecture for scalable Roblox experiences",
    "file": "game-development/roblox-studio/roblox-systems-scripter.md"
  },
  {
    "id": "agency-sales-account-strategist",
    "name": "Account Strategist",
    "category": "sales",
    "description": "Expert post-sale account strategist specializing in land-and-expand execution, stakeholder mapping, QBR facilitation, and net revenue retention. Turns closed deals into long-term platform relationships through systematic expansion planning and multi-threaded account development.",
    "file": "sales/sales-account-strategist.md"
  },
  {
    "id": "agency-sales-coach",
    "name": "Sales Coach",
    "category": "sales",
    "description": "Expert sales coaching specialist focused on rep development, pipeline review facilitation, call coaching, deal strategy, and forecast accuracy. Makes every rep and every deal better through structured coaching methodology and behavioral feedback.",
    "file": "sales/sales-coach.md"
  },
  {
    "id": "agency-sales-data-extraction-agent",
    "name": "Sales Data Extraction Agent",
    "category": "specialized",
    "description": "AI agent specialized in monitoring Excel files and extracting key sales metrics (MTD, YTD, Year End) for internal live reporting",
    "file": "specialized/sales-data-extraction-agent.md"
  },
  {
    "id": "agency-sales-deal-strategist",
    "name": "Deal Strategist",
    "category": "sales",
    "description": "Senior deal strategist specializing in MEDDPICC qualification, competitive positioning, and win planning for complex B2B sales cycles. Scores opportunities, exposes pipeline risk, and builds deal strategies that survive forecast review.",
    "file": "sales/sales-deal-strategist.md"
  },
  {
    "id": "agency-sales-discovery-coach",
    "name": "Discovery Coach",
    "category": "sales",
    "description": "Coaches sales teams on elite discovery methodology — question design, current-state mapping, gap quantification, and call structure that surfaces real buying motivation.",
    "file": "sales/sales-discovery-coach.md"
  },
  {
    "id": "agency-sales-engineer",
    "name": "Sales Engineer",
    "category": "sales",
    "description": "Senior pre-sales engineer specializing in technical discovery, demo engineering, POC scoping, competitive battlecards, and bridging product capabilities to business outcomes. Wins the technical decision so the deal can close.",
    "file": "sales/sales-engineer.md"
  },
  {
    "id": "agency-sales-outbound-strategist",
    "name": "Outbound Strategist",
    "category": "sales",
    "description": "Signal-based outbound specialist who designs multi-channel prospecting sequences, defines ICPs, and builds pipeline through research-driven personalization — not volume.",
    "file": "sales/sales-outbound-strategist.md"
  },
  {
    "id": "agency-sales-outreach",
    "name": "Sales Outreach",
    "category": "specialized",
    "description": "Consultative B2B sales outreach specialist for cold prospecting, lead follow-up, objection handling, proposal writing, and pipeline management — combining data-driven targeting with genuine relationship-building to open doors and close deals",
    "file": "specialized/sales-outreach.md"
  },
  {
    "id": "agency-sales-pipeline-analyst",
    "name": "Pipeline Analyst",
    "category": "sales",
    "description": "Revenue operations analyst specializing in pipeline health diagnostics, deal velocity analysis, forecast accuracy, and data-driven sales coaching. Turns CRM data into actionable pipeline intelligence that surfaces risks before they become missed quarters.",
    "file": "sales/sales-pipeline-analyst.md"
  },
  {
    "id": "agency-sales-proposal-strategist",
    "name": "Proposal Strategist",
    "category": "sales",
    "description": "Strategic proposal architect who transforms RFPs and sales opportunities into compelling win narratives. Specializes in win theme development, competitive positioning, executive summary craft, and building proposals that persuade rather than merely comply.",
    "file": "sales/sales-proposal-strategist.md"
  },
  {
    "id": "agency-specialized-chief-of-staff",
    "name": "Chief of Staff",
    "category": "specialized",
    "description": "Master coordinator for founders and executives — filters noise, owns processes, enforces consistency, routes decisions, and positions outputs for impact so the boss can think clearly.",
    "file": "specialized/specialized-chief-of-staff.md"
  },
  {
    "id": "agency-specialized-civil-engineer",
    "name": "Civil Engineer",
    "category": "specialized",
    "description": "Expert civil and structural engineer with global standards coverage — Eurocode, DIN, ACI, AISC, ASCE, AS/NZS, CSA, GB, IS, AIJ, and more. Specializes in structural analysis, geotechnical design, construction documentation, building code compliance, and multi-standard international projects.",
    "file": "specialized/specialized-civil-engineer.md"
  },
  {
    "id": "agency-specialized-cultural-intelligence-strategist",
    "name": "Cultural Intelligence Strategist",
    "category": "specialized",
    "description": "CQ specialist that detects invisible exclusion, researches global context, and ensures software resonates authentically across intersectional identities.",
    "file": "specialized/specialized-cultural-intelligence-strategist.md"
  },
  {
    "id": "agency-specialized-developer-advocate",
    "name": "Developer Advocate",
    "category": "specialized",
    "description": "Expert developer advocate specializing in building developer communities, creating compelling technical content, optimizing developer experience (DX), and driving platform adoption through authentic engineering engagement. Bridges product and engineering teams with external developers.",
    "file": "specialized/specialized-developer-advocate.md"
  },
  {
    "id": "agency-specialized-document-generator",
    "name": "Document Generator",
    "category": "specialized",
    "description": "Expert document creation specialist who generates professional PDF, PPTX, DOCX, and XLSX files using code-based approaches with proper formatting, charts, and data visualization.",
    "file": "specialized/specialized-document-generator.md"
  },
  {
    "id": "agency-specialized-french-consulting-market",
    "name": "French Consulting Market Navigator",
    "category": "specialized",
    "description": "Navigate the French ESN/SI freelance ecosystem — margin models, platform mechanics (Malt, collective.work), portage salarial, rate positioning, and payment cycle realities",
    "file": "specialized/specialized-french-consulting-market.md"
  },
  {
    "id": "agency-specialized-korean-business-navigator",
    "name": "Korean Business Navigator",
    "category": "specialized",
    "description": "Korean business culture for foreign professionals — 품의 decision process, nunchi reading, KakaoTalk business etiquette, hierarchy navigation, and relationship-first deal mechanics",
    "file": "specialized/specialized-korean-business-navigator.md"
  },
  {
    "id": "agency-specialized-mcp-builder",
    "name": "MCP Builder",
    "category": "specialized",
    "description": "Expert Model Context Protocol developer who designs, builds, and tests MCP servers that extend AI agent capabilities with custom tools, resources, and prompts.",
    "file": "specialized/specialized-mcp-builder.md"
  },
  {
    "id": "agency-specialized-model-qa",
    "name": "Model QA Specialist",
    "category": "specialized",
    "description": "Independent model QA expert who audits ML and statistical models end-to-end - from documentation review and data reconstruction to replication, calibration testing, interpretability analysis, performance monitoring, and audit-grade reporting.",
    "file": "specialized/specialized-model-qa.md"
  },
  {
    "id": "agency-specialized-salesforce-architect",
    "name": "Salesforce Architect",
    "category": "specialized",
    "description": "Solution architecture for Salesforce platform — multi-cloud design, integration patterns, governor limits, deployment strategy, and data model governance for enterprise-scale orgs",
    "file": "specialized/specialized-salesforce-architect.md"
  },
  {
    "id": "agency-specialized-workflow-architect",
    "name": "Workflow Architect",
    "category": "specialized",
    "description": "Workflow design specialist who maps complete workflow trees for every system, user journey, and agent interaction — covering happy paths, all branch conditions, failure modes, recovery paths, handoff contracts, and observable states to produce build-ready specs that agents can implement against and QA can test against.",
    "file": "specialized/specialized-workflow-architect.md"
  },
  {
    "id": "agency-study-abroad-advisor",
    "name": "Study Abroad Advisor",
    "category": "specialized",
    "description": "Full-spectrum study abroad planning expert covering the US, UK, Canada, Australia, Europe, Hong Kong, and Singapore — proficient in undergraduate, master's, and PhD application strategy, school selection, essay coaching, profile enhancement, standardized test planning, visa preparation, and overseas life adaptation, helping Chinese students craft personalized end-to-end study abroad plans.",
    "file": "specialized/study-abroad-advisor.md"
  },
  {
    "id": "agency-supply-chain-strategist",
    "name": "Supply Chain Strategist",
    "category": "specialized",
    "description": "Expert supply chain management and procurement strategy specialist — skilled in supplier development, strategic sourcing, quality control, and supply chain digitalization. Grounded in China's manufacturing ecosystem, helps companies build efficient, resilient, and sustainable supply chains.",
    "file": "specialized/supply-chain-strategist.md"
  },
  {
    "id": "agency-support-analytics-reporter",
    "name": "Analytics Reporter",
    "category": "support",
    "description": "Expert data analyst transforming raw data into actionable business insights. Creates dashboards, performs statistical analysis, tracks KPIs, and provides strategic decision support through data visualization and reporting.",
    "file": "support/support-analytics-reporter.md"
  },
  {
    "id": "agency-support-executive-summary-generator",
    "name": "Executive Summary Generator",
    "category": "support",
    "description": "Consultant-grade AI specialist trained to think and communicate like a senior strategy consultant. Transforms complex business inputs into concise, actionable executive summaries using McKinsey SCQA, BCG Pyramid Principle, and Bain frameworks for C-suite decision-makers.",
    "file": "support/support-executive-summary-generator.md"
  },
  {
    "id": "agency-support-finance-tracker",
    "name": "Finance Tracker",
    "category": "support",
    "description": "Expert financial analyst and controller specializing in financial planning, budget management, and business performance analysis. Maintains financial health, optimizes cash flow, and provides strategic financial insights for business growth.",
    "file": "support/support-finance-tracker.md"
  },
  {
    "id": "agency-support-infrastructure-maintainer",
    "name": "Infrastructure Maintainer",
    "category": "support",
    "description": "Expert infrastructure specialist focused on system reliability, performance optimization, and technical operations management. Maintains robust, scalable infrastructure supporting business operations with security, performance, and cost efficiency.",
    "file": "support/support-infrastructure-maintainer.md"
  },
  {
    "id": "agency-support-legal-compliance-checker",
    "name": "Legal Compliance Checker",
    "category": "support",
    "description": "Expert legal and compliance specialist ensuring business operations, data handling, and content creation comply with relevant laws, regulations, and industry standards across multiple jurisdictions.",
    "file": "support/support-legal-compliance-checker.md"
  },
  {
    "id": "agency-support-support-responder",
    "name": "Support Responder",
    "category": "support",
    "description": "Expert customer support specialist delivering exceptional customer service, issue resolution, and user experience optimization. Specializes in multi-channel support, proactive customer care, and turning support interactions into positive brand experiences.",
    "file": "support/support-support-responder.md"
  },
  {
    "id": "agency-technical-artist",
    "name": "Technical Artist",
    "category": "game-development",
    "description": "Art-to-engine pipeline specialist - Masters shaders, VFX systems, LOD pipelines, performance budgeting, and cross-engine asset optimization",
    "file": "game-development/technical-artist.md"
  },
  {
    "id": "agency-terminal-integration-specialist",
    "name": "Terminal Integration Specialist",
    "category": "spatial-computing",
    "description": "Terminal emulation, text rendering optimization, and SwiftTerm integration for modern Swift applications",
    "file": "spatial-computing/terminal-integration-specialist.md"
  },
  {
    "id": "agency-testing-accessibility-auditor",
    "name": "Accessibility Auditor",
    "category": "testing",
    "description": "Expert accessibility specialist who audits interfaces against WCAG standards, tests with assistive technologies, and ensures inclusive design. Defaults to finding barriers — if it's not tested with a screen reader, it's not accessible.",
    "file": "testing/testing-accessibility-auditor.md"
  },
  {
    "id": "agency-testing-api-tester",
    "name": "API Tester",
    "category": "testing",
    "description": "Expert API testing specialist focused on comprehensive API validation, performance testing, and quality assurance across all systems and third-party integrations",
    "file": "testing/testing-api-tester.md"
  },
  {
    "id": "agency-testing-evidence-collector",
    "name": "Evidence Collector",
    "category": "testing",
    "description": "Screenshot-obsessed, fantasy-allergic QA specialist - Default to finding 3-5 issues, requires visual proof for everything",
    "file": "testing/testing-evidence-collector.md"
  },
  {
    "id": "agency-testing-performance-benchmarker",
    "name": "Performance Benchmarker",
    "category": "testing",
    "description": "Expert performance testing and optimization specialist focused on measuring, analyzing, and improving system performance across all applications and infrastructure",
    "file": "testing/testing-performance-benchmarker.md"
  },
  {
    "id": "agency-testing-reality-checker",
    "name": "Reality Checker",
    "category": "testing",
    "description": "Stops fantasy approvals, evidence-based certification - Default to \"NEEDS WORK\", requires overwhelming proof for production readiness",
    "file": "testing/testing-reality-checker.md"
  },
  {
    "id": "agency-testing-test-results-analyzer",
    "name": "Test Results Analyzer",
    "category": "testing",
    "description": "Expert test analysis specialist focused on comprehensive test result evaluation, quality metrics analysis, and actionable insight generation from testing activities",
    "file": "testing/testing-test-results-analyzer.md"
  },
  {
    "id": "agency-testing-tool-evaluator",
    "name": "Tool Evaluator",
    "category": "testing",
    "description": "Expert technology assessment specialist focused on evaluating, testing, and recommending tools, software, and platforms for business use and productivity optimization",
    "file": "testing/testing-tool-evaluator.md"
  },
  {
    "id": "agency-testing-workflow-optimizer",
    "name": "Workflow Optimizer",
    "category": "testing",
    "description": "Expert process improvement specialist focused on analyzing, optimizing, and automating workflows across all business functions for maximum productivity and efficiency",
    "file": "testing/testing-workflow-optimizer.md"
  },
  {
    "id": "agency-unity-architect",
    "name": "Unity Architect",
    "category": "game-development",
    "description": "Data-driven modularity specialist - Masters ScriptableObjects, decoupled systems, and single-responsibility component design for scalable Unity projects",
    "file": "game-development/unity/unity-architect.md"
  },
  {
    "id": "agency-unity-editor-tool-developer",
    "name": "Unity Editor Tool Developer",
    "category": "game-development",
    "description": "Unity editor automation specialist - Masters custom EditorWindows, PropertyDrawers, AssetPostprocessors, ScriptedImporters, and pipeline automation that saves teams hours per week",
    "file": "game-development/unity/unity-editor-tool-developer.md"
  },
  {
    "id": "agency-unity-multiplayer-engineer",
    "name": "Unity Multiplayer Engineer",
    "category": "game-development",
    "description": "Networked gameplay specialist - Masters Netcode for GameObjects, Unity Gaming Services (Relay/Lobby), client-server authority, lag compensation, and state synchronization",
    "file": "game-development/unity/unity-multiplayer-engineer.md"
  },
  {
    "id": "agency-unity-shader-graph-artist",
    "name": "Unity Shader Graph Artist",
    "category": "game-development",
    "description": "Visual effects and material specialist - Masters Unity Shader Graph, HLSL, URP/HDRP rendering pipelines, and custom pass authoring for real-time visual effects",
    "file": "game-development/unity/unity-shader-graph-artist.md"
  },
  {
    "id": "agency-unreal-multiplayer-architect",
    "name": "Unreal Multiplayer Architect",
    "category": "game-development",
    "description": "Unreal Engine networking specialist - Masters Actor replication, GameMode/GameState architecture, server-authoritative gameplay, network prediction, and dedicated server setup for UE5",
    "file": "game-development/unreal-engine/unreal-multiplayer-architect.md"
  },
  {
    "id": "agency-unreal-systems-engineer",
    "name": "Unreal Systems Engineer",
    "category": "game-development",
    "description": "Performance and hybrid architecture specialist - Masters C++/Blueprint continuum, Nanite geometry, Lumen GI, and Gameplay Ability System for AAA-grade Unreal Engine projects",
    "file": "game-development/unreal-engine/unreal-systems-engineer.md"
  },
  {
    "id": "agency-unreal-technical-artist",
    "name": "Unreal Technical Artist",
    "category": "game-development",
    "description": "Unreal Engine visual pipeline specialist - Masters the Material Editor, Niagara VFX, Procedural Content Generation, and the art-to-engine pipeline for UE5 projects",
    "file": "game-development/unreal-engine/unreal-technical-artist.md"
  },
  {
    "id": "agency-unreal-world-builder",
    "name": "Unreal World Builder",
    "category": "game-development",
    "description": "Open-world and environment specialist - Masters UE5 World Partition, Landscape, procedural foliage, HLOD, and large-scale level streaming for seamless open-world experiences",
    "file": "game-development/unreal-engine/unreal-world-builder.md"
  },
  {
    "id": "agency-visionos-spatial-engineer",
    "name": "visionOS Spatial Engineer",
    "category": "spatial-computing",
    "description": "Native visionOS spatial computing, SwiftUI volumetric interfaces, and Liquid Glass design implementation",
    "file": "spatial-computing/visionos-spatial-engineer.md"
  },
  {
    "id": "agency-xr-cockpit-interaction-specialist",
    "name": "XR Cockpit Interaction Specialist",
    "category": "spatial-computing",
    "description": "Specialist in designing and developing immersive cockpit-based control systems for XR environments",
    "file": "spatial-computing/xr-cockpit-interaction-specialist.md"
  },
  {
    "id": "agency-xr-immersive-developer",
    "name": "XR Immersive Developer",
    "category": "spatial-computing",
    "description": "Expert WebXR and immersive technology developer with specialization in browser-based AR/VR/XR applications",
    "file": "spatial-computing/xr-immersive-developer.md"
  },
  {
    "id": "agency-xr-interface-architect",
    "name": "XR Interface Architect",
    "category": "spatial-computing",
    "description": "Spatial interaction designer and interface strategist for immersive AR/VR/XR environments",
    "file": "spatial-computing/xr-interface-architect.md"
  },
  {
    "id": "agency-zk-steward",
    "name": "ZK Steward",
    "category": "specialized",
    "description": "Knowledge-base steward in the spirit of Niklas Luhmann's Zettelkasten. Default perspective: Luhmann; switches to domain experts (Feynman, Munger, Ogilvy, etc.) by task. Enforces atomic notes, connectivity, and validation loops. Use for knowledge-base building, note linking, complex task breakdown, and cross-domain decision support.",
    "file": "specialized/zk-steward.md"
  }
];

function walk(dir: string, out: string[] = []): string[] {
  try { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { if (entry.name.startsWith('.')) continue; const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full, out); else if (entry.name.endsWith('.md') && !full.includes(`${path.sep}integrations${path.sep}`)) out.push(full); } } catch { /* optional library */ }
  return out;
}
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fm = (raw: string, key: string) => raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
function definitions(): AgencyDefinition[] { const root = path.join(process.cwd(), 'agency-agents'); const files = walk(root); if (files.length === 0) return AGENCY_MANIFEST; return files.map((file) => { const raw = fs.readFileSync(file, 'utf8'); if (!raw.startsWith('---') || !fm(raw, 'name')) return null; const base = path.basename(file, '.md'); return { id: `agency-${slug(base)}`, name: fm(raw, 'name'), category: path.relative(root, file).split(path.sep)[0] || 'specialized', description: fm(raw, 'description') || 'Agency specialist.', file: path.relative(root, file).split(path.sep).join('/') }; }).filter((d): d is AgencyDefinition => Boolean(d)).sort((a, b) => a.id.localeCompare(b.id)); }
function department(category: string): string { if (['engineering', 'integrations', 'spatial-computing', 'game-development'].includes(category)) return 'dept-tech'; if (['design', 'marketing', 'paid-media'].includes(category)) return 'dept-marketing-growth'; if (category === 'sales') return 'dept-sales'; return 'dept-clients'; }
export function agencyDefinitions() { return definitions(); }
export function agencySeedAgents(): Agent[] { return definitions().map((d) => ({ id: d.id, departmentId: department(d.category), name: d.name, role: `${d.category} specialist`, status: 'active' as const, tier: 'specialist' as const, description: `${d.description} Loaded from agency-agents/${d.file} and grounded by shared G-Brain.`, model: 'shared LLM + G-Brain', tools: ['gbrain'], parentId: null, instance: 'builtin' })); }

function cmsChatTools(): LlmToolSpec[] {
  return [{
    name: 'checkWordPressConnection',
    description: 'Check the live primary WordPress site, REST API, authentication, and available capabilities. Read-only: never changes site content.',
    parameters: z.object({}),
    execute: async () => wordPressStatus(runtimeEnv()),
  }, wordpressImportTool(), ...wordpressContentTools(), ...elementorBridgeTools()];
}

export function agencyRuntimeAgents(): RuntimeAgent[] {
  return definitions().map((d) => ({
    id: d.id,
    name: d.name,
    description: `${d.description} Agency source: ${d.file}.`,
    departmentId: department(d.category),
    async run() {
      return { ok: true, summary: `${d.name} ready · shared G-Brain grounding enabled`, data: { source: d.file } };
    },
    ...(d.id === 'agency-engineering-cms-developer' ? { chatTools: cmsChatTools } : {}),
  }));
}
