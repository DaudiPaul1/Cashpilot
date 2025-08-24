import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { generateInsights } from '@/lib/ai/insights';
import { calculateFinancialHealthScore, analyzeTrends, assessBusinessRisks } from '@/lib/ai/scoring';
import { analyzeDataSourcesForInsights } from '@/lib/ai/dataSourceAnalyzer';
import { createDataAdapter } from '@/lib/calculations/dataAdapters';
import { requireAuth } from '@/lib/security/auth';
import { withSecurityAndCors } from '@/lib/security/headers';
import { createRateLimitedAPI, apiRateLimiter } from '@/lib/security/rateLimiter';
import { validateAIInsightsRequest, sanitizeTransactionInput } from '@/lib/validation/schemas';
import { handleApiError, ValidationError, DatabaseError } from '@/lib/errors/handler';
import { monitorApiCall } from '@/lib/performance/monitor';

// Create rate-limited and secured API handler
const handler = createRateLimitedAPI(apiRateLimiter, async (request: NextRequest) => {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      
      // Validate request data
      const validationResult = validateAIInsightsRequest(body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors
        });
      }

      const { transactions, shopifyOrders = [], quickbooksInvoices = [], quickbooksBills = [] } = body;

      // Sanitize transaction data
      const sanitizedTransactions = transactions.map(sanitizeTransactionInput);

      // Create data adapter
      const dataAdapter = createDataAdapter(
        sanitizedTransactions,
        shopifyOrders,
        quickbooksInvoices,
        quickbooksBills
      );

      // Generate insights with performance monitoring
      const insightsPromise = generateInsights(sanitizedTransactions, dataAdapter);
      const insights = await monitorApiCall('/api/ai/insights/generate', insightsPromise);
      
      // Calculate health score with performance monitoring
      const healthScorePromise = calculateFinancialHealthScore(sanitizedTransactions, dataAdapter);
      const healthScore = await monitorApiCall('/api/ai/insights/health-score', healthScorePromise);
      
      // Analyze trends with performance monitoring
      const trendsPromise = analyzeTrends(sanitizedTransactions, dataAdapter);
      const trends = await monitorApiCall('/api/ai/insights/trends', trendsPromise);
      
      // Assess risks with performance monitoring
      const risksPromise = assessBusinessRisks(sanitizedTransactions, dataAdapter);
      const risks = await monitorApiCall('/api/ai/insights/risks', risksPromise);
      
      // Analyze data sources for adaptive insights
      const adaptiveStrategyPromise = analyzeDataSourcesForInsights(sanitizedTransactions, dataAdapter);
      const adaptiveStrategy = await monitorApiCall('/api/ai/insights/adaptive', adaptiveStrategyPromise);

      return NextResponse.json({
        success: true,
        insights,
        healthScore,
        trends,
        risks,
        adaptiveStrategy
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
});

export const POST = withSecurityAndCors(handler);

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Return available insight types
    return NextResponse.json({
      success: true,
      availableInsights: [
        'financial-health-score',
        'revenue-analysis',
        'expense-analysis',
        'cash-flow-analysis',
        'customer-insights',
        'trend-analysis',
        'risk-assessment',
        'data-quality-analysis',
        'adaptive-recommendations'
      ],
      dataSources: [
        'manual',
        'shopify',
        'quickbooks',
        'combined'
      ]
    });
  } catch (error) {
    console.error('AI Insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
