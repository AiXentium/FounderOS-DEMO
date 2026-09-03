import type { RevenueSpine, RevenueEntity } from './revenue-spine';

export type AttributionModel = 'first-touch' | 'last-touch' | 'linear';

export type AttributedValue = {
  sourceId: string;
  revenueUsd: number;
  contributionProfitUsd: number;
  credit: number;
};

function money(entity: RevenueEntity, key: string): number {
  const value = entity.metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function attributeSource(spine: RevenueSpine, sourceId: string): Omit<AttributedValue, 'credit'> {
  const downstream = spine.traceRevenueFrom(sourceId);
  return {
    sourceId,
    revenueUsd: downstream.filter((entity) => entity.type === 'revenue' || entity.type === 'payment').reduce((sum, entity) => sum + money(entity, 'amountUsd'), 0),
    contributionProfitUsd: downstream.filter((entity) => entity.type === 'margin').reduce((sum, entity) => sum + money(entity, 'amountUsd'), 0),
  };
}

export function distributeAttribution(
  sourceIds: string[],
  totalRevenueUsd: number,
  totalContributionProfitUsd: number,
  model: AttributionModel,
): AttributedValue[] {
  if (!sourceIds.length) return [];
  if (model === 'first-touch') {
    return sourceIds.map((sourceId, index) => ({ sourceId, revenueUsd: index === 0 ? totalRevenueUsd : 0, contributionProfitUsd: index === 0 ? totalContributionProfitUsd : 0, credit: index === 0 ? 1 : 0 }));
  }
  if (model === 'last-touch') {
    return sourceIds.map((sourceId, index) => ({ sourceId, revenueUsd: index === sourceIds.length - 1 ? totalRevenueUsd : 0, contributionProfitUsd: index === sourceIds.length - 1 ? totalContributionProfitUsd : 0, credit: index === sourceIds.length - 1 ? 1 : 0 }));
  }
  const credit = 1 / sourceIds.length;
  return sourceIds.map((sourceId) => ({ sourceId, revenueUsd: totalRevenueUsd * credit, contributionProfitUsd: totalContributionProfitUsd * credit, credit }));
}
