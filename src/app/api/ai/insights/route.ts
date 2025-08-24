import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { generateInsights } from '@/lib/ai/insights';
import { calculateFinancialHealthScore, analyzeTrends, assessBusinessRisks } from '@/lib/ai/scoring';
import { analyzeDataSourcesForInsights } from '@/lib/ai/dataSourceAnalyzer';
import { createDataAdapter } from '@/lib/calculations/dataAdapters';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { transactions, shopifyOrders = [], quickbooksInvoices = [], quickbooksBills = [] } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid transactions data' }, { status: 400 });
    }

    // Create data adapter
    const dataAdapter = createDataAdapter(
      transactions,
      shopifyOrders,
      quickbooksInvoices,
      quickbooksBills
    );

    // Generate insights
    const insights = generateInsights(transactions, dataAdapter);
    
    // Calculate health score
    const healthScore = calculateFinancialHealthScore(transactions, dataAdapter);
    
    // Analyze trends
    const trends = analyzeTrends(transactions, dataAdapter);
    
    // Assess risks
    const risks = assessBusinessRisks(transactions, dataAdapter);
    
    // Analyze data sources for adaptive insights
    const adaptiveStrategy = analyzeDataSourcesForInsights(transactions, dataAdapter);

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
}

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
