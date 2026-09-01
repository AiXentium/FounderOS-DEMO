import { NextResponse } from 'next/server';
import {
  executeContentWorkflow,
  executeCampaignWorkflow,
  executeAffiliateWorkflow,
  executeAnalyticsWorkflow,
  executeTeamWorkflow,
  type WorkflowExecutionResult,
} from '@/lib/workflow-executor';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    const results: WorkflowExecutionResult[] = [];

    // Execute all 5 workflows in sequence
    console.log('Starting workflow execution suite...');

    // 1. Content Workflow
    console.log('Executing Content Workflow...');
    const contentResult = await executeContentWorkflow({
      topic: 'AI-Powered Business Automation',
      businessContext: 'A comprehensive guide to implementing AI in business operations',
      targetAudience: 'Business operators and entrepreneurs',
      keywordFocus: ['AI automation', 'business efficiency', 'workflow optimization'],
    });
    results.push(contentResult);

    // 2. Campaign Workflow
    console.log('Executing Campaign Workflow...');
    const campaignResult = await executeCampaignWorkflow({
      campaignName: 'Summer 2026 Growth Campaign',
      objectives: [
        'Increase brand awareness by 50%',
        'Generate 100 qualified leads',
        'Achieve 15% conversion rate',
      ],
      targetAudience: 'Tech-savvy entrepreneurs',
      platforms: ['LinkedIn', 'Twitter', 'Facebook'],
      contentPieces: 12,
    });
    results.push(campaignResult);

    // 3. Affiliate Workflow
    console.log('Executing Affiliate Workflow...');
    const affiliateResult = await executeAffiliateWorkflow({
      products: [
        { id: 'prod-001', name: 'AI Business Suite', url: 'https://example.com/products/ai-suite' },
        { id: 'prod-002', name: 'Automation Framework', url: 'https://example.com/products/automation' },
        { id: 'prod-003', name: 'Analytics Dashboard', url: 'https://example.com/products/analytics' },
      ],
      campaign: { id: 'campaign-summer-2026', name: 'Summer 2026 Growth Campaign' },
      trackingParams: {
        utm_source: 'affiliate_network',
        utm_medium: 'referral',
        utm_campaign: 'summer_2026',
      },
    });
    results.push(affiliateResult);

    // 4. Analytics Workflow
    console.log('Executing Analytics Workflow...');
    const analyticsResult = await executeAnalyticsWorkflow({
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      platforms: ['blog', 'social', 'email'],
      contentIds: [
        'content-001',
        'content-002',
        'content-003',
        'content-004',
        'content-005',
        'content-006',
        'content-007',
        'content-008',
        'content-009',
        'content-010',
      ],
    });
    results.push(analyticsResult);

    // 5. Team Workflow
    console.log('Executing Team Workflow...');
    const teamResult = await executeTeamWorkflow({
      teamName: 'Business Operations Team',
      agentCount: 5,
      roles: ['Content Creator', 'Data Analyst', 'Campaign Manager', 'Developer', 'QA Specialist'],
    });
    results.push(teamResult);

    // Calculate summary statistics
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const totalSteps = results.reduce((sum, r) => sum + r.steps.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    const executionSummary = {
      executedAt: new Date().toISOString(),
      duration: duration,
      totalWorkflows: results.length,
      successfulWorkflows: successCount,
      failedWorkflows: results.filter(r => r.status === 'failed').length,
      totalSteps: totalSteps,
      successfulSteps: results.reduce((sum, r) => sum + r.steps.filter(s => s.status === 'success').length, 0),
      totalErrors: totalErrors,
      results: results,
    };

    return NextResponse.json(executionSummary, { status: 200 });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      {
        error: 'Workflow execution failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Return info about the workflow execution endpoint
  return NextResponse.json({
    endpoint: '/api/workflows/execute',
    method: 'POST',
    description: 'Executes all 5 business workflows end-to-end',
    workflows: [
      'Content Workflow (research → publish → analytics)',
      'Campaign Workflow (create → deploy → monitor)',
      'Affiliate Workflow (create links → track conversions)',
      'Analytics Workflow (gather metrics → report)',
      'Team Workflow (create agents → assign tasks)',
    ],
    usage: 'POST /api/workflows/execute',
    expectedResponse: {
      executedAt: 'ISO timestamp',
      duration: 'milliseconds',
      totalWorkflows: 5,
      successfulWorkflows: '0-5',
      failedWorkflows: '0-5',
      totalSteps: 'number',
      successfulSteps: 'number',
      totalErrors: 'number',
      results: 'array of workflow results',
    },
  });
}
