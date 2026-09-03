import { createMissionPlan } from './mission-planner';

/**
 * Portable end-to-end mission used to prove that website + UGC + marketing +
 * sales + attribution can operate as one connected system. It is intentionally
 * adapter-free: no live connector is invoked until Business OS integration.
 */
export function createGoldenMarketingMission(businessId: string, objective: string) {
  return createMissionPlan({
    businessId,
    objective,
    ownerRole: 'cmo',
    steps: [
      {
        title: 'Load business, audience, offer and brand context',
        ownerRole: 'tbrain',
        requiredCapabilities: ['knowledge.retrieval'],
        evidenceRequired: ['context sources', 'constraints', 'known gaps'],
      },
      {
        title: 'Create measurable campaign strategy and success hypothesis',
        ownerRole: 'cmo',
        requiredCapabilities: ['planning.goal-decomposition', 'marketing.social-analysis'],
        dependsOn: ['1'],
        evidenceRequired: ['target audience', 'offer', 'channels', 'KPIs', 'test hypothesis'],
      },
      {
        title: 'Create hooks, scripts and UGC production brief',
        ownerRole: 'creative-director',
        requiredCapabilities: ['marketing.hook-writing', 'marketing.ugc-generation'],
        dependsOn: ['2'],
        evidenceRequired: ['approved hooks', 'scripts', 'storyboard or shot list', 'CTA variants'],
      },
      {
        title: 'Produce and edit platform-specific UGC variants',
        ownerRole: 'ugc-studio',
        requiredCapabilities: ['marketing.ugc-generation', 'marketing.video-editing'],
        dependsOn: ['3'],
        evidenceRequired: ['source assets', 'final variants', 'format metadata', 'creative QA report'],
      },
      {
        title: 'Build or update campaign landing experience',
        ownerRole: 'website',
        requiredCapabilities: ['website.seo-brief', 'website.visual-qa'],
        dependsOn: ['2'],
        evidenceRequired: ['page specification', 'render evidence', 'responsive QA', 'conversion QA'],
      },
      {
        title: 'Prepare publication package for human approval',
        ownerRole: 'cmo',
        requiredCapabilities: ['marketing.cross-post', 'website.wordpress-publish'],
        dependsOn: ['4', '5'],
        risk: 'yellow',
        evidenceRequired: ['exact website diff', 'publishing schedule', 'asset manifest', 'tracking plan'],
      },
      {
        title: 'Measure leads, pipeline and revenue attribution',
        ownerRole: 'cro',
        requiredCapabilities: ['sales.reply-qualification', 'analytics.revenue-attribution'],
        dependsOn: ['6'],
        evidenceRequired: ['lead counts', 'qualified leads', 'pipeline movement', 'attributed revenue'],
      },
      {
        title: 'Judge campaign outcome and propose next experiment',
        ownerRole: 'tbrain',
        requiredCapabilities: ['evaluation.judge', 'marketing.social-analysis'],
        dependsOn: ['7'],
        evidenceRequired: ['KPI comparison', 'failure analysis', 'winning patterns', 'next experiment'],
      },
    ],
  });
}
