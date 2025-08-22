import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { authenticate, rateLimit } from '../middleware/auth';
import { DashboardData, ChartDataPoint, KPI } from '../types';

const router = Router();

// Validation schemas
const dashboardParamsSchema = z.object({
  days: z.string().optional().transform(val => parseInt(val || '30'))
});

const transactionParamsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview with KPIs and recent data
 * @access  Private
 */
router.get('/overview', authenticate, rateLimit(100, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { days } = dashboardParamsSchema.parse(req.query);
    const userId = req.user.id;

    // Get dashboard data using database function
    const { data: dashboardData, error } = await db.query(async (client) => {
      return await client.rpc('get_user_dashboard_data', {
        user_uuid: userId,
        days_back: days
      });
    });

    if (error) {
      console.error('Database error getting dashboard data:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load dashboard data'
      });
    }

    // Get recent insights
    const { data: insights } = await db.getUserInsights(userId, undefined, 5);

    // Get user subscription status
    const { data: subscription } = await db.getUserSubscription(userId);

    // Calculate additional KPIs
    const kpis = dashboardData?.kpis || {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      savingsRate: 0,
      transactionCount: 0
    };

    // Generate chart data for the last 30 days
    const chartData = await generateChartData(userId, days);

    const response: DashboardData = {
      kpis: {
        totalIncome: kpis.total_income || 0,
        totalExpenses: kpis.total_expenses || 0,
        netCashFlow: (kpis.total_income || 0) - (kpis.total_expenses || 0),
        savingsRate: kpis.savings_rate || 0,
        transactionCount: kpis.transaction_count || 0
      },
      recentTransactions: dashboardData?.recent_transactions || [],
      chartData,
      insights: insights || [],
      score: {
        id: 'current',
        userId,
        period: 'weekly',
        score: calculateHealthScore(kpis),
        metrics: kpis,
        createdAt: new Date()
      }
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/dashboard/transactions
 * @desc    Get paginated transactions
 * @access  Private
 */
router.get('/transactions', authenticate, rateLimit(200, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { page, limit, type, startDate, endDate } = transactionParamsSchema.parse(req.query);
    const userId = req.user.id;

    const offset = (page - 1) * limit;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const { data: transactions, error } = await db.getUserTransactions(userId, {
      limit,
      offset,
      startDate: start,
      endDate: end,
      type
    });

    if (error) {
      console.error('Database error getting transactions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load transactions'
      });
    }

    // Get total count for pagination
    const { data: totalCount } = await db.query(async (client) => {
      let query = client
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (start) {
        query = query.gte('transaction_date', start.toISOString().split('T')[0]);
      }
      if (end) {
        query = query.lte('transaction_date', end.toISOString().split('T')[0]);
      }
      if (type) {
        query = query.eq('type', type);
      }

      return await query;
    });

    const total = totalCount?.length || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
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

    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get detailed analytics and breakdowns
 * @access  Private
 */
router.get('/analytics', authenticate, rateLimit(50, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { days } = dashboardParamsSchema.parse(req.query);
    const userId = req.user.id;

    // Get spending breakdown by category
    const { data: spendingBreakdown } = await db.query(async (client) => {
      return await client.rpc('get_spending_breakdown', {
        user_uuid: userId,
        days_back: days
      });
    });

    // Get income breakdown by source
    const { data: incomeBreakdown } = await db.query(async (client) => {
      return await client.rpc('get_income_breakdown', {
        user_uuid: userId,
        days_back: days
      });
    });

    // Get financial health score
    const { data: healthScore } = await db.query(async (client) => {
      return await client.rpc('calculate_financial_health_score', {
        user_uuid: userId
      });
    });

    res.json({
      success: true,
      data: {
        spendingBreakdown: spendingBreakdown || [],
        incomeBreakdown: incomeBreakdown || [],
        healthScore: healthScore || 0,
        period: `${days} days`
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

    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/dashboard/insights
 * @desc    Get AI-generated insights
 * @access  Private
 */
router.get('/insights', authenticate, rateLimit(50, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { type, limit } = z.object({
      type: z.enum(['daily', 'weekly', 'monthly']).optional(),
      limit: z.string().optional().transform(val => parseInt(val || '10'))
    }).parse(req.query);

    const userId = req.user.id;

    const { data: insights, error } = await db.getUserInsights(userId, type, limit);

    if (error) {
      console.error('Database error getting insights:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load insights'
      });
    }

    res.json({
      success: true,
      data: {
        insights: insights || [],
        type: type || 'all'
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

    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/dashboard/scores
 * @desc    Get historical financial health scores
 * @access  Private
 */
router.get('/scores', authenticate, rateLimit(50, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { period, limit } = z.object({
      period: z.enum(['daily', 'weekly', 'monthly']).optional(),
      limit: z.string().optional().transform(val => parseInt(val || '30'))
    }).parse(req.query);

    const userId = req.user.id;

    const { data: scores, error } = await db.query(async (client) => {
      let query = client
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (period) {
        query = query.eq('period', period);
      }

      return await query;
    });

    if (error) {
      console.error('Database error getting scores:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load scores'
      });
    }

    res.json({
      success: true,
      data: {
        scores: scores || [],
        period: period || 'all'
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

    console.error('Get scores error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Generate chart data for cash flow visualization
 */
async function generateChartData(userId: string, days: number): Promise<ChartDataPoint[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: transactions } = await db.getUserTransactions(userId, {
      startDate,
      endDate
    });

    if (!transactions) return [];

    // Group transactions by date
    const dailyData = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(transaction => {
      const date = transaction.transaction_date.split('T')[0];
      const current = dailyData.get(date) || { income: 0, expenses: 0 };

      if (transaction.type === 'income') {
        current.income += transaction.amount;
      } else if (transaction.type === 'expense') {
        current.expenses += Math.abs(transaction.amount);
      }

      dailyData.set(date, current);
    });

    // Convert to chart data format
    const chartData: ChartDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData.get(dateStr) || { income: 0, expenses: 0 };

      chartData.push({
        date: dateStr,
        income: dayData.income,
        expenses: dayData.expenses,
        net: dayData.income - dayData.expenses
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return chartData;
  } catch (error) {
    console.error('Error generating chart data:', error);
    return [];
  }
}

/**
 * Calculate financial health score based on KPIs
 */
function calculateHealthScore(kpis: any): number {
  const savingsRate = kpis.savings_rate || 0;
  const netCashFlow = (kpis.total_income || 0) - (kpis.total_expenses || 0);
  const income = kpis.total_income || 0;

  let score = 0;

  // Savings rate component (40% weight)
  if (savingsRate >= 0.2) score += 40;
  else if (savingsRate >= 0.1) score += 30;
  else if (savingsRate >= 0.05) score += 20;
  else if (savingsRate >= 0) score += 10;

  // Cash flow component (30% weight)
  if (netCashFlow > 0) {
    const cashFlowRatio = netCashFlow / income;
    if (cashFlowRatio >= 0.3) score += 30;
    else if (cashFlowRatio >= 0.2) score += 25;
    else if (cashFlowRatio >= 0.1) score += 20;
    else score += 15;
  }

  // Income stability component (30% weight)
  if (income > 0) {
    score += 30; // For now, just having income is good
  }

  return Math.min(100, Math.max(0, score));
}

export default router;
