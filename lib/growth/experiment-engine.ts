export type ExperimentStatus = 'draft' | 'approved' | 'running' | 'complete' | 'rejected';

export type ExperimentVariant = {
  id: string;
  label: string;
  description: string;
};

export type ExperimentMetric = {
  variantId: string;
  impressions?: number;
  clicks?: number;
  leads?: number;
  qualifiedLeads?: number;
  opportunities?: number;
  sales?: number;
  revenueUsd?: number;
  contributionProfitUsd?: number;
  spendUsd?: number;
};

export type GrowthExperiment = {
  id: string;
  businessId: string;
  hypothesis: string;
  primaryMetric: 'qualifiedLeadCac' | 'revenue' | 'contributionProfit' | 'conversionRate' | 'closeRate';
  guardrailMetrics: string[];
  variants: ExperimentVariant[];
  status: ExperimentStatus;
  minimumEvidence: {
    minImpressions?: number;
    minQualifiedLeads?: number;
    minSales?: number;
  };
};

export type ExperimentJudgment = {
  experimentId: string;
  verdict: 'insufficient-evidence' | 'winner' | 'no-clear-winner' | 'harmful';
  winningVariantId?: string;
  rationale: string[];
};

function rate(num = 0, den = 0): number | null {
  return den > 0 ? num / den : null;
}

function metricValue(metric: ExperimentMetric, primary: GrowthExperiment['primaryMetric']): number | null {
  switch (primary) {
    case 'qualifiedLeadCac':
      return metric.qualifiedLeads && metric.spendUsd !== undefined ? metric.spendUsd / metric.qualifiedLeads : null;
    case 'revenue':
      return metric.revenueUsd ?? null;
    case 'contributionProfit':
      return metric.contributionProfitUsd ?? null;
    case 'conversionRate':
      return rate(metric.leads, metric.clicks);
    case 'closeRate':
      return rate(metric.sales, metric.opportunities);
  }
}

function enoughEvidence(experiment: GrowthExperiment, metric: ExperimentMetric): boolean {
  const m = experiment.minimumEvidence;
  if (m.minImpressions && (metric.impressions ?? 0) < m.minImpressions) return false;
  if (m.minQualifiedLeads && (metric.qualifiedLeads ?? 0) < m.minQualifiedLeads) return false;
  if (m.minSales && (metric.sales ?? 0) < m.minSales) return false;
  return true;
}

export function judgeExperiment(experiment: GrowthExperiment, metrics: ExperimentMetric[]): ExperimentJudgment {
  const byVariant = new Map(metrics.map((metric) => [metric.variantId, metric]));
  const complete = experiment.variants
    .map((variant) => ({ variant, metric: byVariant.get(variant.id) }))
    .filter((item): item is { variant: ExperimentVariant; metric: ExperimentMetric } => !!item.metric);

  if (complete.length !== experiment.variants.length || complete.some((item) => !enoughEvidence(experiment, item.metric))) {
    return { experimentId: experiment.id, verdict: 'insufficient-evidence', rationale: ['Minimum evidence threshold has not been reached for every variant.'] };
  }

  const scored = complete
    .map((item) => ({ ...item, value: metricValue(item.metric, experiment.primaryMetric) }))
    .filter((item): item is typeof item & { value: number } => item.value !== null);

  if (scored.length !== complete.length) {
    return { experimentId: experiment.id, verdict: 'insufficient-evidence', rationale: ['Primary metric cannot yet be calculated for every variant.'] };
  }

  const lowerIsBetter = experiment.primaryMetric === 'qualifiedLeadCac';
  scored.sort((a, b) => lowerIsBetter ? a.value - b.value : b.value - a.value);
  const best = scored[0];
  const second = scored[1];

  if (!second) return { experimentId: experiment.id, verdict: 'winner', winningVariantId: best.variant.id, rationale: ['Only one valid variant was supplied.'] };

  const separation = Math.abs(best.value - second.value) / Math.max(Math.abs(second.value), 0.0001);
  if (separation < 0.05) {
    return { experimentId: experiment.id, verdict: 'no-clear-winner', rationale: ['Top variants are within 5% on the primary metric; preserve uncertainty.'] };
  }

  return {
    experimentId: experiment.id,
    verdict: 'winner',
    winningVariantId: best.variant.id,
    rationale: [`Variant ${best.variant.label} leads the primary metric with sufficient evidence.`, 'This is an operational experiment verdict, not a causal claim beyond the measured test design.'],
  };
}
