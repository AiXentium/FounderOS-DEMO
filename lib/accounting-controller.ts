import fs from 'node:fs';
import path from 'node:path';
import { configuredProcessors } from '@/lib/connectors/payments';
import { runtimeEnv } from '@/lib/creds';
import { openBankStore } from '@/lib/bank';
import { openLedger } from '@/lib/ledger';
import type { FounderDb } from '@/lib/db';
import type { Agent } from '@/lib/schemas';
import type { AgentRunResult, RuntimeAgent } from '@/lib/agents/runtime';
import { z } from 'zod';
import type { LlmToolSpec } from '@/lib/connectors/llm';

type Project = {
  prompt?: string;
  name?: string;
  page?: Record<string, unknown>;
};

export type AccountingBusinessProfile = {
  active: boolean;
  sector: 'travel-agency' | 'general-business';
  businessName: string;
  businessType: string;
  projectMode: string;
  country: string;
  region: string;
  entityType: string;
  taxYear: string;
  capabilities: string[];
};

export type AccountingReadiness = {
  active: boolean;
  profile: AccountingBusinessProfile;
  brain: { state: 'shared'; detail: string };
  paymentProcessors: Array<{ name: string; configured: boolean }>;
  bankFeed: { state: 'connected' | 'not_configured'; detail: string };
  statementData: { available: boolean; rows: number; detail: string };
  ledger: { available: boolean; rows: number; detail: string };
  tax: { state: 'ready' | 'needs_profile'; detail: string };
  nextSteps: string[];
};

export const ACCOUNTING_CONTROLLER_AGENT: Agent = {
  id: 'accounting-controller',
  departmentId: 'dept-finance',
  name: 'Accounting Controller',
  role: 'Accounting & Tax Controller',
  status: 'planned',
  tier: 'lead',
  description: 'Reusable accounting controller for bookkeeping, reconciliation, close management, tax-estimate preparation, and finance controls grounded in the shared G-Brain.',
  model: 'OpenAI + G-Brain + accounting controls',
  tools: ['ledger', 'payments', 'bank', 'gbrain'],
  parentId: null,
  instance: 'builtin',
};

const TRAVEL_WORDS = /travel|tour|agency|hospitality|booking|affiliate|destination|vacation|trip/i;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function newestProject(db: FounderDb): Project | undefined {
  return db.websiteProjects.all()[0] as Project | undefined;
}

export function accountingBusinessProfile(db: FounderDb): AccountingBusinessProfile {
  const project = newestProject(db);
  const page = project?.page ?? {};
  const prompt = text(project?.prompt);
  const businessType = text(page.businessType) || prompt.split('.')[0] || '';
  const projectMode = text(page.projectMode) || prompt.split('.')[1] || '';
  const businessName = text(page.businessName) || text(project?.name) || 'Business';
  const source = [businessType, projectMode, prompt, businessName, text(page.domain)].join(' ');
  const sector = TRAVEL_WORDS.test(source) ? 'travel-agency' : 'general-business';
  const active = Boolean(project && (businessType || prompt || text(page.domain)));
  const capabilities = [
    'Bookkeeping and chart-of-accounts review',
    'Payment and bank-statement reconciliation',
    'Month-end close, journal-entry support, and financial statements',
    'Cash-flow, variance, and control reporting',
    'Tax estimate preparation with human/professional review gates',
  ];
  if (sector === 'travel-agency') {
    capabilities.push(
      'Travel affiliate commission and supplier-revenue reconciliation',
      'Booking fees, refunds, chargebacks, and multi-currency travel revenue review',
    );
  }
  return {
    active,
    sector,
    businessName,
    businessType: businessType || 'not configured',
    projectMode: projectMode || 'not configured',
    country: text(page.country) || text(page.taxCountry) || text(runtimeEnv().BUSINESS_COUNTRY),
    region: text(page.region) || text(page.state) || text(runtimeEnv().BUSINESS_REGION),
    entityType: text(page.entityType) || text(runtimeEnv().BUSINESS_ENTITY_TYPE),
    taxYear: text(page.taxYear) || text(runtimeEnv().TAX_YEAR) || String(new Date().getUTCFullYear()),
    capabilities,
  };
}

function localStoreRows(kind: 'bank' | 'ledger'): number {
  const file = kind === 'bank'
    ? (process.env.BANK_DB ?? path.join(process.cwd(), 'data', 'bank.db'))
    : (process.env.LEDGER_DB ?? path.join(process.cwd(), 'data', 'ledger.db'));
  if (file !== ':memory:' && !fs.existsSync(file)) return 0;
  try {
    if (kind === 'bank') {
      const store = openBankStore(file);
      const rows = store.all().length;
      store.close();
      return rows;
    }
    const ledger = openLedger(file);
    const rows = ledger.rowCount();
    ledger.close();
    return rows;
  } catch {
    return 0;
  }
}

export function accountingReadiness(db: FounderDb): AccountingReadiness {
  const profile = accountingBusinessProfile(db);
  const env = runtimeEnv();
  const processors = configuredProcessors(env);
  const configured = processors.filter((processor) => processor.configured);
  const statementRows = localStoreRows('bank');
  const ledgerRows = localStoreRows('ledger');
  const hasBankFeed = Boolean(env.BANK_FEED_ACCESS_TOKEN || env.PLAID_ACCESS_TOKEN);
  const taxReady = Boolean(profile.country && profile.region && profile.entityType && profile.taxYear);
  const nextSteps: string[] = [];
  if (!configured.length) nextSteps.push('Connect a payment processor such as Stripe before closing revenue periods.');
  if (!hasBankFeed && !statementRows) nextSteps.push('Connect a real bank-feed provider or upload a bank statement summary.');
  if (!taxReady) nextSteps.push('Add country, region, entity type, and tax year before relying on tax estimates.');
  return {
    active: profile.active,
    profile,
    brain: { state: 'shared', detail: 'Uses the same G-Brain context and durable audit trail as the rest of the OS.' },
    paymentProcessors: processors.map(({ name, configured: isConfigured }) => ({ name, configured: isConfigured })),
    bankFeed: hasBankFeed
      ? { state: 'connected', detail: 'Bank-feed credential is present; provider execution still requires a supported adapter.' }
      : { state: 'not_configured', detail: statementRows ? 'No live bank feed; uploaded statement summaries are available.' : 'No live bank feed or statement summaries configured.' },
    statementData: { available: statementRows > 0, rows: statementRows, detail: statementRows ? `${statementRows} statement summaries available.` : 'No statement summaries available.' },
    ledger: { available: ledgerRows > 0, rows: ledgerRows, detail: ledgerRows ? `${ledgerRows} ledger rows available.` : 'No ledger rows available.' },
    tax: taxReady
      ? { state: 'ready', detail: `Tax-estimate inputs present for ${profile.entityType} in ${profile.country}${profile.region ? ` (${profile.region})` : ''}, tax year ${profile.taxYear}; professional review remains required.` }
      : { state: 'needs_profile', detail: 'Tax estimates are not ready until country, region/entity details, and tax year are configured.' },
    nextSteps,
  };
}

export function syncAccountingControllerActivation(db: FounderDb): AccountingReadiness {
  const readiness = accountingReadiness(db);
  const existing = db.agents.all().find((agent) => agent.id === ACCOUNTING_CONTROLLER_AGENT.id);
  const desiredStatus = readiness.active ? 'active' : 'planned';
  if (!existing) {
    db.agents.insert({ ...ACCOUNTING_CONTROLLER_AGENT, status: desiredStatus });
  } else if (existing.status !== desiredStatus) {
    db.agents.insert({ ...existing, status: desiredStatus });
  }
  return readiness;
}

function summary(readiness: AccountingReadiness): string {
  const { profile } = readiness;
  const processors = readiness.paymentProcessors.filter((processor) => processor.configured).map((processor) => processor.name);
  return [
    `Accounting Controller: ${readiness.active ? 'ACTIVE' : 'PLANNED'} for ${profile.sector === 'travel-agency' ? 'this travel agency' : profile.businessName}.`,
    `Shared brain: CONNECTED — ${readiness.brain.detail}`,
    `Payment processors: ${processors.length ? processors.join(', ') : 'none configured'}.`,
    `Bank data: ${readiness.bankFeed.detail}${readiness.statementData.available ? ` ${readiness.statementData.detail}` : ''}`,
    `Ledger: ${readiness.ledger.detail}`,
    `Tax: ${readiness.tax.detail}`,
    `Capabilities: ${profile.capabilities.join('; ')}.`,
    readiness.nextSteps.length ? `Next steps: ${readiness.nextSteps.join(' ')}` : 'Readiness checks passed for the configured sources; all posting and tax decisions remain approval-gated.',
  ].join('\n');
}

export function accountingControllerRuntime(): RuntimeAgent {
  const read = async (): Promise<AgentRunResult> => {
    const { getDb } = await import('@/lib/data');
    const readiness = syncAccountingControllerActivation(getDb());
    return { ok: readiness.active, summary: summary(readiness), data: readiness };
  };
  return {
    id: ACCOUNTING_CONTROLLER_AGENT.id,
    name: ACCOUNTING_CONTROLLER_AGENT.name,
    description: ACCOUNTING_CONTROLLER_AGENT.description,
    departmentId: ACCOUNTING_CONTROLLER_AGENT.departmentId,
    run: read,
    respond: read,
    chatTools(): LlmToolSpec[] {
      return [{
        name: 'auditAccountingReadiness',
        description: 'Read the live accounting controller profile, payment processors, bank/statement data, ledger, shared G-Brain status, and tax readiness. Read-only.',
        parameters: z.object({}),
        execute: async () => {
          const { getDb } = await import('@/lib/data');
          return syncAccountingControllerActivation(getDb());
        },
      }];
    },
  };
}
