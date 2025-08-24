import { Transaction } from '@/types';
import { HealthScoreResult, HealthScoreFactors } from '@/types/financial';
import { calculateCashFlow, calculateTransactionSummary } from './cashFlow';

/**
 * Calculate overall financial health score
 */
export function calculateHealthScore(transactions: Transaction[]): HealthScoreResult {
  if (transactions.length === 0) {
    return {
      overallScore: 0,
      grade: 'F',
      factors: {
        cashFlow: 0,
        profitability: 0,
        liquidity: 0,
        efficiency: 0,
        growth: 0
      },
      recommendations: ['No transaction data available to calculate health score'],
      lastUpdated: new Date()
    };
  }

  const factors = calculateHealthFactors(transactions);
  const overallScore = calculateOverallScore(factors);
  const grade = calculateGrade(overallScore);
  const recommendations = generateRecommendations(factors, transactions);

  return {
    overallScore,
    grade,
    factors,
    recommendations,
    lastUpdated: new Date()
  };
}

/**
 * Calculate individual health factors
 */
function calculateHealthFactors(transactions: Transaction[]): HealthScoreFactors {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Calculate cash flow health
  const currentCashFlow = calculateCashFlow(transactions, thirtyDaysAgo, now, 'monthly');
  const previousCashFlow = calculateCashFlow(transactions, sixtyDaysAgo, thirtyDaysAgo, 'monthly');
  
  const cashFlowScore = calculateCashFlowScore(currentCashFlow, previousCashFlow);

  // Calculate profitability
  const profitabilityScore = calculateProfitabilityScore(currentCashFlow);

  // Calculate liquidity
  const liquidityScore = calculateLiquidityScore(transactions, currentCashFlow);

  // Calculate efficiency
  const efficiencyScore = calculateEfficiencyScore(transactions);

  // Calculate growth
  const growthScore = calculateGrowthScore(currentCashFlow, previousCashFlow);

  return {
    cashFlow: cashFlowScore,
    profitability: profitabilityScore,
    liquidity: liquidityScore,
    efficiency: efficiencyScore,
    growth: growthScore
  };
}

/**
 * Calculate cash flow health score
 */
function calculateCashFlowScore(
  current: any,
  previous: any
): number {
  // Positive cash flow gets high score
  if (current.netCashFlow > 0) {
    const baseScore = 80;
    
    // Bonus for improving cash flow
    if (current.netCashFlow > previous.netCashFlow) {
      return Math.min(100, baseScore + 20);
    }
    
    return baseScore;
  }

  // Negative cash flow gets lower score
  if (current.netCashFlow < 0) {
    const baseScore = 30;
    
    // Penalty for worsening cash flow
    if (current.netCashFlow < previous.netCashFlow) {
      return Math.max(0, baseScore - 20);
    }
    
    return baseScore;
  }

  return 50; // Neutral
}

/**
 * Calculate profitability score
 */
function calculateProfitabilityScore(cashFlow: any): number {
  if (cashFlow.income === 0) return 0;

  const profitMargin = ((cashFlow.income - cashFlow.expenses) / cashFlow.income) * 100;

  if (profitMargin >= 20) return 100;
  if (profitMargin >= 15) return 90;
  if (profitMargin >= 10) return 80;
  if (profitMargin >= 5) return 70;
  if (profitMargin >= 0) return 60;
  if (profitMargin >= -5) return 40;
  if (profitMargin >= -10) return 20;
  return 0;
}

/**
 * Calculate liquidity score
 */
function calculateLiquidityScore(transactions: Transaction[], cashFlow: any): number {
  // Calculate cash runway
  const monthlyExpenses = cashFlow.expenses;
  const currentCash = cashFlow.netCashFlow;
  const cashRunway = monthlyExpenses > 0 ? currentCash / (monthlyExpenses / 30) : 0;

  if (cashRunway >= 180) return 100; // 6+ months
  if (cashRunway >= 90) return 90;   // 3+ months
  if (cashRunway >= 60) return 80;   // 2+ months
  if (cashRunway >= 30) return 70;   // 1+ month
  if (cashRunway >= 15) return 50;   // 2+ weeks
  if (cashRunway >= 7) return 30;    // 1+ week
  return 10; // Less than a week
}

/**
 * Calculate efficiency score
 */
function calculateEfficiencyScore(transactions: Transaction[]): number {
  const summary = calculateTransactionSummary(transactions);
  
  if (summary.transactionCount === 0) return 0;

  // Calculate average transaction value
  const avgValue = summary.averageTransactionValue;
  
  // Higher average transaction values indicate better efficiency
  if (avgValue >= 10000) return 100;
  if (avgValue >= 5000) return 90;
  if (avgValue >= 2000) return 80;
  if (avgValue >= 1000) return 70;
  if (avgValue >= 500) return 60;
  if (avgValue >= 200) return 50;
  if (avgValue >= 100) return 40;
  return 30;
}

/**
 * Calculate growth score
 */
function calculateGrowthScore(current: any, previous: any): number {
  if (previous.income === 0) return 50; // Neutral if no previous data

  const growthRate = ((current.income - previous.income) / previous.income) * 100;

  if (growthRate >= 50) return 100;
  if (growthRate >= 25) return 90;
  if (growthRate >= 10) return 80;
  if (growthRate >= 5) return 70;
  if (growthRate >= 0) return 60;
  if (growthRate >= -5) return 40;
  if (growthRate >= -10) return 20;
  return 0;
}

/**
 * Calculate overall score from factors
 */
function calculateOverallScore(factors: HealthScoreFactors): number {
  const weights = {
    cashFlow: 0.25,
    profitability: 0.25,
    liquidity: 0.20,
    efficiency: 0.15,
    growth: 0.15
  };

  return Math.round(
    factors.cashFlow * weights.cashFlow +
    factors.profitability * weights.profitability +
    factors.liquidity * weights.liquidity +
    factors.efficiency * weights.efficiency +
    factors.growth * weights.growth
  );
}

/**
 * Calculate letter grade from score
 */
function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate recommendations based on health factors
 */
function generateRecommendations(factors: HealthScoreFactors, transactions: Transaction[]): string[] {
  const recommendations: string[] = [];

  // Cash flow recommendations
  if (factors.cashFlow < 60) {
    recommendations.push('Focus on improving cash flow by reducing expenses or increasing revenue');
  }

  // Profitability recommendations
  if (factors.profitability < 70) {
    recommendations.push('Consider raising prices or reducing costs to improve profit margins');
  }

  // Liquidity recommendations
  if (factors.liquidity < 60) {
    recommendations.push('Build up cash reserves to improve financial stability');
  }

  // Efficiency recommendations
  if (factors.efficiency < 60) {
    recommendations.push('Look for ways to increase average transaction values');
  }

  // Growth recommendations
  if (factors.growth < 60) {
    recommendations.push('Focus on revenue growth strategies to improve business performance');
  }

  // Add positive recommendations for good scores
  if (factors.cashFlow >= 80) {
    recommendations.push('Excellent cash flow management - consider investing in growth opportunities');
  }

  if (factors.profitability >= 80) {
    recommendations.push('Strong profitability - you can afford to invest in business expansion');
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}
