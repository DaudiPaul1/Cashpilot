import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';
import { db } from '../config/database';
import { authenticate, rateLimit } from '../middleware/auth';
import { AIInsight, FinancialHealthScore, CashFlowForecast } from '../types';

const router = Router();

// Initialize Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env['CLAUDE_API_KEY'],
});

// Validation schemas
const generateInsightSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  focus: z.enum(['spending', 'income', 'savings', 'general']).optional()
});

const forecastSchema = z.object({
  period: z.enum(['30', '60', '90']).default('30')
});

/**
 * @route   POST /api/ai/generate-insight
 * @desc    Generate AI-powered financial insight
 * @access  Private
 */
router.post('/generate-insight', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { type, focus } = generateInsightSchema.parse(req.body);
    const userId = req.user.id;

    // Get user's financial data for the last 30 days
    const { data: dashboardData } = await db.query(async (client) => {
      return await client.rpc('get_user_dashboard_data', {
        user_uuid: userId,
        days_back: 30
      });
    });

    if (!dashboardData) {
      return res.status(400).json({
        success: false,
        error: 'No financial data available for insight generation'
      });
    }

    // Get recent transactions for context
    const { data: transactions } = await db.getUserTransactions(userId, {
      limit: 20,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    // Prepare data for AI analysis
    const financialData = {
      kpis: dashboardData.kpis,
      recentTransactions: transactions?.slice(0, 10) || [],
      period: type
    };

    // Generate insight using Claude AI
    const insight = await generateAIInsight(financialData, focus);

    // Save insight to database
    const { data: savedInsight, error } = await db.query(async (client) => {
      return await client
        .from('insights')
        .insert([{
          user_id: userId,
          type,
          title: insight.title,
          content: insight.content,
          score: insight.score,
          metadata: insight.metadata
        }])
        .select()
        .single();
    });

    if (error) {
      console.error('Database error saving insight:', error);
      // Don't fail the request, just log the error
    }

    res.json({
      success: true,
      data: {
        insight: savedInsight || insight,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    console.error('Generate insight error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insight'
    });
  }
});

/**
 * @route   POST /api/ai/calculate-score
 * @desc    Calculate comprehensive financial health score
 * @access  Private
 */
router.post('/calculate-score', authenticate, rateLimit(5, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;

    // Get comprehensive financial data
    const { data: dashboardData } = await db.query(async (client) => {
      return await client.rpc('get_user_dashboard_data', {
        user_uuid: userId,
        days_back: 90
      });
    });

    const { data: spendingBreakdown } = await db.query(async (client) => {
      return await client.rpc('get_spending_breakdown', {
        user_uuid: userId,
        days_back: 90
      });
    });

    const { data: incomeBreakdown } = await db.query(async (client) => {
      return await client.rpc('get_income_breakdown', {
        user_uuid: userId,
        days_back: 90
      });
    });

    // Calculate comprehensive financial health score
    const score = await calculateFinancialHealthScore({
      kpis: dashboardData?.kpis,
      spendingBreakdown: spendingBreakdown || [],
      incomeBreakdown: incomeBreakdown || []
    });

    // Save score to database
    const { data: savedScore, error } = await db.query(async (client) => {
      return await client
        .from('scores')
        .insert([{
          user_id: userId,
          period: 'weekly',
          score: score.score,
          metrics: score.metrics
        }])
        .select()
        .single();
    });

    if (error) {
      console.error('Database error saving score:', error);
    }

    res.json({
      success: true,
      data: {
        score: savedScore || score,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Calculate score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate financial health score'
    });
  }
});

/**
 * @route   POST /api/ai/forecast
 * @desc    Generate cash flow forecast
 * @access  Private
 */
router.post('/forecast', authenticate, rateLimit(5, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { period } = forecastSchema.parse(req.body);
    const userId = req.user.id;

    // Get historical data for forecasting
    const { data: transactions } = await db.getUserTransactions(userId, {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    });

    if (!transactions || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient historical data for forecasting'
      });
    }

    // Generate cash flow forecast
    const forecast = await generateCashFlowForecast(transactions, parseInt(period));

    res.json({
      success: true,
      data: {
        forecast,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast'
    });
  }
});

/**
 * @route   GET /api/ai/insights-history
 * @desc    Get historical AI insights
 * @access  Private
 */
router.get('/insights-history', authenticate, rateLimit(50, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { type, limit } = z.object({
      type: z.enum(['daily', 'weekly', 'monthly']).optional(),
      limit: z.string().optional().transform(val => parseInt(val || '20'))
    }).parse(req.query);

    const userId = req.user.id;

    const { data: insights, error } = await db.getUserInsights(userId, type, limit);

    if (error) {
      console.error('Database error getting insights history:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load insights history'
      });
    }

    res.json({
      success: true,
      data: {
        insights: insights || [],
        total: insights?.length || 0
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    console.error('Get insights history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Generate AI insight using Claude
 */
async function generateAIInsight(financialData: any, focus?: string): Promise<AIInsight> {
  try {
    const prompt = buildInsightPrompt(financialData, focus);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the AI response
    const insight = parseAIResponse(content.text);

    return {
      id: crypto.randomUUID(),
      title: insight.title,
      content: insight.content,
      score: insight.score,
      category: insight.category,
      metadata: insight.metadata
    };
  } catch (error) {
    console.error('AI insight generation error:', error);
    
    // Return a fallback insight
    return {
      id: crypto.randomUUID(),
      title: 'Financial Overview',
      content: 'Your financial data is being analyzed. Check back soon for personalized insights.',
      score: 0.5,
      category: 'general',
      metadata: {
        recommendation: 'Continue monitoring your finances regularly.',
        positiveObservation: 'You\'re taking steps to track your financial health.',
        keyMetrics: financialData.kpis
      }
    };
  }
}

/**
 * Build prompt for AI insight generation
 */
function buildInsightPrompt(financialData: any, focus?: string): string {
  const { kpis, recentTransactions, period } = financialData;
  
  let focusPrompt = '';
  if (focus) {
    switch (focus) {
      case 'spending':
        focusPrompt = 'Focus on spending patterns and expense optimization opportunities.';
        break;
      case 'income':
        focusPrompt = 'Focus on income sources and potential for income growth.';
        break;
      case 'savings':
        focusPrompt = 'Focus on savings rate and financial security.';
        break;
      default:
        focusPrompt = 'Provide a general financial health assessment.';
    }
  }

  return `You are a financial advisor analyzing a client's financial data. ${focusPrompt}

Financial Data:
- Total Income: $${kpis.total_income || 0}
- Total Expenses: $${kpis.total_expenses || 0}
- Net Cash Flow: $${(kpis.total_income || 0) - (kpis.total_expenses || 0)}
- Savings Rate: ${((kpis.savings_rate || 0) * 100).toFixed(1)}%
- Transaction Count: ${kpis.transaction_count || 0}
- Period: ${period}

Recent Transactions (last 10):
${recentTransactions.map((t: any) => `- ${t.description}: $${t.amount} (${t.type})`).join('\n')}

Please provide:
1. A concise title (max 50 characters)
2. A detailed analysis (2-3 paragraphs)
3. A score from 0-1 (where 1 is excellent)
4. A category: 'positive', 'warning', or 'recommendation'
5. Specific recommendations
6. Positive observations
7. Key metrics to highlight

Format your response as JSON:
{
  "title": "string",
  "content": "string", 
  "score": number,
  "category": "string",
  "metadata": {
    "recommendation": "string",
    "positiveObservation": "string",
    "keyMetrics": {}
  }
}`;
}

/**
 * Parse AI response into structured data
 */
function parseAIResponse(response: string): any {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback parsing
    return {
      title: 'Financial Insight',
      content: response,
      score: 0.5,
      category: 'general',
      metadata: {
        recommendation: 'Continue monitoring your finances.',
        positiveObservation: 'You\'re taking steps to track your financial health.',
        keyMetrics: {}
      }
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      title: 'Financial Insight',
      content: response,
      score: 0.5,
      category: 'general',
      metadata: {
        recommendation: 'Continue monitoring your finances.',
        positiveObservation: 'You\'re taking steps to track your financial health.',
        keyMetrics: {}
      }
    };
  }
}

/**
 * Calculate comprehensive financial health score
 */
async function calculateFinancialHealthScore(data: any): Promise<FinancialHealthScore> {
  const { kpis, spendingBreakdown, incomeBreakdown } = data;
  
  let score = 0;
  const metrics: any = {};

  // Savings rate component (30%)
  const savingsRate = kpis.savings_rate || 0;
  if (savingsRate >= 0.2) score += 30;
  else if (savingsRate >= 0.1) score += 20;
  else if (savingsRate >= 0.05) score += 10;
  metrics.savingsRate = savingsRate;

  // Cash flow component (25%)
  const netCashFlow = (kpis.total_income || 0) - (kpis.total_expenses || 0);
  const cashFlowRatio = kpis.total_income > 0 ? netCashFlow / kpis.total_income : 0;
  if (cashFlowRatio >= 0.2) score += 25;
  else if (cashFlowRatio >= 0.1) score += 15;
  else if (cashFlowRatio >= 0) score += 5;
  metrics.cashFlow = netCashFlow;

  // Income diversity component (20%)
  const incomeSources = incomeBreakdown.length;
  if (incomeSources >= 3) score += 20;
  else if (incomeSources >= 2) score += 15;
  else if (incomeSources >= 1) score += 10;
  metrics.incomeSources = incomeSources;

  // Spending control component (15%)
  const topSpendingCategory = spendingBreakdown[0];
  const spendingConcentration = topSpendingCategory ? 
    topSpendingCategory.total / (kpis.total_expenses || 1) : 0;
  if (spendingConcentration <= 0.3) score += 15;
  else if (spendingConcentration <= 0.5) score += 10;
  else if (spendingConcentration <= 0.7) score += 5;
  metrics.spendingConcentration = spendingConcentration;

  // Emergency fund component (10%)
  // This would require additional data about savings accounts
  score += 10; // Placeholder
  metrics.emergencyFund = 'Not available';

  // Calculate grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 80) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';
  else if (score >= 20) grade = 'D';
  else grade = 'F';

  // Generate explanation
  const explanation = generateScoreExplanation(score, grade, metrics);

  // Generate recommendations
  const recommendations = generateRecommendations(score, metrics);

  return {
    score,
    grade,
    explanation,
    recommendations,
    metrics
  };
}

/**
 * Generate explanation for financial health score
 */
function generateScoreExplanation(score: number, grade: string, metrics: any): string {
  if (grade === 'A') {
    return `Excellent financial health! Your score of ${score}/100 shows strong financial management. You're saving ${(metrics.savingsRate * 100).toFixed(1)}% of your income and maintaining positive cash flow.`;
  } else if (grade === 'B') {
    return `Good financial health with room for improvement. Your score of ${score}/100 indicates solid fundamentals. Consider increasing your savings rate and diversifying income sources.`;
  } else if (grade === 'C') {
    return `Fair financial health. Your score of ${score}/100 suggests some areas need attention. Focus on reducing expenses and building emergency savings.`;
  } else if (grade === 'D') {
    return `Poor financial health. Your score of ${score}/100 indicates significant challenges. Prioritize debt reduction and expense management.`;
  } else {
    return `Critical financial health. Your score of ${score}/100 requires immediate attention. Seek professional financial advice and focus on basic financial stability.`;
  }
}

/**
 * Generate recommendations based on score and metrics
 */
function generateRecommendations(score: number, metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.savingsRate < 0.1) {
    recommendations.push('Increase your savings rate to at least 10% of income');
  }

  if (metrics.cashFlow < 0) {
    recommendations.push('Focus on reducing expenses to achieve positive cash flow');
  }

  if (metrics.incomeSources < 2) {
    recommendations.push('Consider diversifying your income sources');
  }

  if (metrics.spendingConcentration > 0.5) {
    recommendations.push('Diversify your spending across different categories');
  }

  if (score < 60) {
    recommendations.push('Build an emergency fund covering 3-6 months of expenses');
  }

  return recommendations;
}

/**
 * Generate cash flow forecast
 */
async function generateCashFlowForecast(transactions: any[], period: number): Promise<CashFlowForecast> {
  // Simple forecasting based on historical averages
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const avgIncome = incomeTransactions.length > 0 ? 
    incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length : 0;
  const avgExpense = expenseTransactions.length > 0 ? 
    expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / expenseTransactions.length : 0;

  const forecastData = [];
  const startDate = new Date();

  for (let i = 1; i <= period; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Add some randomness to make it more realistic
    const incomeVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    const expenseVariation = 0.9 + Math.random() * 0.2; // ±10% variation

    const projectedIncome = avgIncome * incomeVariation;
    const projectedExpenses = avgExpense * expenseVariation;
    const projectedNet = projectedIncome - projectedExpenses;

    // Confidence decreases over time
    const confidence = Math.max(0.3, 1 - (i / period) * 0.7);

    forecastData.push({
      date: date.toISOString().split('T')[0],
      projectedIncome,
      projectedExpenses,
      projectedNet,
      confidence
    });
  }

  return {
    period: period.toString() as '30' | '60' | '90',
    data: forecastData
  };
}

export default router;
