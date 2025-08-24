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

// Create rate-limited and secured API handler
const handler = createRateLimitedAPI(apiRateLimiter, async (request: NextRequest) => {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      
      // Validate request data
      const validationResult = validateAIInsightsRequest(body);
      if (!validationResult.success) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validationResult.error.errors
        }, { status: 400 });
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

      // Generate insights
      const insights = generateInsights(sanitizedTransactions, dataAdapter);
      
      // Calculate health score
      const healthScore = calculateFinancialHealthScore(sanitizedTransactions, dataAdapter);
      
      // Analyze trends
      const trends = analyzeTrends(sanitizedTransactions, dataAdapter);
      
      // Assess risks
      const risks = assessBusinessRisks(sanitizedTransactions, dataAdapter);
      
      // Analyze data sources for adaptive insights
      const adaptiveStrategy = analyzeDataSourcesForInsights(sanitizedTransactions, dataAdapter);

      return NextResponse.json({
        success: true,
        insights,
        healthScore,
        trends,
        risks,
        adaptiveStrategy
      });
    } catch (error) {
      console.error('AI Insights API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
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
