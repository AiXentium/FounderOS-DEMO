import { describe, expect, test } from 'vitest';
import { layoutBrainNodes } from '@/lib/brain-viz';

describe('BrainViz hydration regression', () => {
  test('rounds page-node coordinates before rendering SVG attributes', () => {
    // Regression: ISSUE-001 — BrainViz emitted server/client-different SVG coordinates
    // Found by /qa on 2026-08-30
    // Report: .gstack/qa-reports/qa-report-localhost-4100-2026-08-30.md
    const { nodes } = layoutBrainNodes([
      { label: 'operations', pages: 4 },
      { label: 'growth', pages: 3 },
      { label: 'clients', pages: 3 },
    ]);

    for (const node of nodes) {
      expect(node.x).toBe(Math.round(node.x * 100) / 100);
      expect(node.y).toBe(Math.round(node.y * 100) / 100);
    }
  });
});
