export type GrowthChannelSnapshot = {
  id: string;
  label: string;
  spendUsd: number;
  revenueUsd: number;
  contributionProfitUsd: number;
  qualifiedLeads: number;
  opportunities: number;
  sales: number;
  creativeFatigue?: number; // 0-1, higher = more fatigue
  capacityConstraint?: number; // 0-1, higher = less safe to scale
};

export type RevenueAction =
  | { type: 'scale'; channelId: string; score: number; reason: string }
  | { type: 'hold'; channelId: string; score: number; reason: string }
  | { type: 'pause'; channelId: string; score: number; reason: string }
  | { type: 'refresh-creative'; channelId: string; score: number; reason: string }
  | { type: 'repair-funnel'; channelId: string; score: number; reason: string };

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export function recommendRevenueActions(channels: GrowthChannelSnapshot[]): RevenueAction[] {
  const actions: RevenueAction[] = [];
  for (const channel of channels) {
    const roas = safeDiv(channel.revenueUsd, channel.spendUsd);
    const profitRoas = safeDiv(channel.contributionProfitUsd, channel.spendUsd);
    const leadToOpp = safeDiv(channel.opportunities, channel.qualifiedLeads);
    const oppToSale = safeDiv(channel.sales, channel.opportunities);
    const fatigue = channel.creativeFatigue ?? 0;
    const capacity = channel.capacityConstraint ?? 0;

    if (channel.spendUsd > 0 && channel.qualifiedLeads === 0) {
      actions.push({ type: 'pause', channelId: channel.id, score: 100, reason: 'Spend is occurring without qualified leads.' });
      continue;
    }

    if (fatigue >= 0.7 && roas > 0) {
      actions.push({ type: 'refresh-creative', channelId: channel.id, score: 85, reason: 'Channel still produces value but creative fatigue is high.' });
    }

    if (channel.qualifiedLeads >= 5 && leadToOpp < 0.15) {
      actions.push({ type: 'repair-funnel', channelId: channel.id, score: 80, reason: 'Qualified leads are entering but too few become opportunities; inspect offer, qualification, handoff, and landing experience.' });
    }

    if (profitRoas >= 1.5 && oppToSale >= 0.2 && capacity < 0.7 && fatigue < 0.7) {
      actions.push({ type: 'scale', channelId: channel.id, score: Math.min(99, 60 + profitRoas * 10), reason: 'Contribution-profit return, close rate, capacity, and creative health support a controlled scale test.' });
    } else if (profitRoas <= 0 && channel.spendUsd > 0) {
      actions.push({ type: 'pause', channelId: channel.id, score: 90, reason: 'Channel is currently unprofitable on contribution profit.' });
    } else {
      actions.push({ type: 'hold', channelId: channel.id, score: 50, reason: 'Evidence does not yet justify scaling or pausing; preserve budget while more data accumulates.' });
    }
  }

  return actions.sort((a, b) => b.score - a.score);
}
