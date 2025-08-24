import { Transaction } from '@/types';
import { DataAdapter } from '@/lib/calculations/dataAdapters';

export interface FinancialHealthScore {
  overall: number; // 0-100
  categories: {
    revenue: number;
    expenses: number;
    cashFlow: number;
    customers: number;
    operations: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    recommendations: string[];
  };
  lastUpdated: Date;
}

export interface TrendAnalysis {
  period: string;
  trends: {
    revenue: 'increasing' | 'decreasing' | 'stable';
    expenses: 'increasing' | 'decreasing' | 'stable';
    cashFlow: 'increasing' | 'decreasing' | 'stable';
    customers: 'increasing' | 'decreasing' | 'stable';
  };
  confidence: number;
  insights: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    cashFlowRisk: number;
    customerConcentrationRisk: number;
    expenseRisk: number;
    revenueRisk: number;
  };
  recommendations: string[];
}

/**
 * Calculate comprehensive financial health score
 */
export function calculateFinancialHealthScore(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): FinancialHealthScore {
  const revenueData = dataAdapter.getRevenueData();
  const expenseData = dataAdapter.getExpenseData();
  const customerData = dataAdapter.getCustomerData();
  
  // Calculate category scores
  const revenueScore = calculateRevenueScore(revenueData);
  const expenseScore = calculateExpenseScore(expenseData, revenueData);
  const cashFlowScore = calculateCashFlowScore(revenueData, expenseData);
  const customerScore = calculateCustomerScore(customerData);
  const operationsScore = calculateOperationsScore(dataAdapter);
  
  // Calculate overall score (weighted average)
  const overall = Math.round(
    (revenueScore * 0.25) +
    (expenseScore * 0.25) +
    (cashFlowScore * 0.25) +
    (customerScore * 0.15) +
    (operationsScore * 0.10)
  );
  
  // Identify factors
  const factors = identifyHealthFactors(
    revenueData,
    expenseData,
    customerData,
    dataAdapter
  );
  
  return {
    overall: Math.max(0, Math.min(100, overall)),
    categories: {
      revenue: revenueScore,
      expenses: expenseScore,
      cashFlow: cashFlowScore,
      customers: customerScore,
      operations: operationsScore
    },
    factors,
    lastUpdated: new Date()
  };
}

/**
 * Calculate revenue health score
 */
function calculateRevenueScore(revenueData: any): number {
  let score = 100;
  
  // Revenue growth factor
  if (revenueData.totalRevenue > 0) {
    const monthlyRevenue = Object.values(revenueData.revenueByPeriod);
    if (monthlyRevenue.length >= 2) {
      const recentMonths = monthlyRevenue.slice(-3);
      const previousMonths = monthlyRevenue.slice(-6, -3);
      
      if (recentMonths.length > 0 && previousMonths.length > 0) {
        const recentAvg = recentMonths.reduce((a: number, b: number) => a + b, 0) / recentMonths.length;
        const previousAvg = previousMonths.reduce((a: number, b: number) => a + b, 0) / previousMonths.length;
        const growthRate = ((recentAvg - previousAvg) / previousAvg) * 100;
        
        if (growthRate > 10) score += 20;
        else if (growthRate > 0) score += 10;
        else if (growthRate < -10) score -= 20;
        else if (growthRate < 0) score -= 10;
      }
    }
  }
  
  // Recurring revenue factor
  if (revenueData.totalRevenue > 0) {
    const recurringPercentage = (revenueData.recurringRevenue / revenueData.totalRevenue) * 100;
    if (recurringPercentage > 70) score += 15;
    else if (recurringPercentage > 50) score += 10;
    else if (recurringPercentage < 30) score -= 10;
  }
  
  // Revenue diversity factor
  const categories = Object.keys(revenueData.revenueByCategory);
  if (categories.length >= 3) score += 10;
  else if (categories.length === 1) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate expense health score
 */
function calculateExpenseScore(expenseData: any, revenueData: any): number {
  let score = 100;
  
  // Expense ratio factor
  if (revenueData.totalRevenue > 0) {
    const expenseRatio = (expenseData.totalExpenses / revenueData.totalRevenue) * 100;
    if (expenseRatio < 50) score += 20;
    else if (expenseRatio < 70) score += 10;
    else if (expenseRatio > 90) score -= 30;
    else if (expenseRatio > 80) score -= 20;
  }
  
  // Expense control factor
  const expenseCategories = Object.keys(expenseData.expensesByCategory);
  if (expenseCategories.length >= 5) score += 10; // Good categorization
  else if (expenseCategories.length <= 2) score -= 10; // Poor categorization
  
  // Operating vs COGS ratio
  if (expenseData.totalExpenses > 0) {
    const operatingRatio = (expenseData.operatingExpenses / expenseData.totalExpenses) * 100;
    if (operatingRatio < 60) score += 10; // Good cost structure
    else if (operatingRatio > 80) score -= 10; // High overhead
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate cash flow health score
 */
function calculateCashFlowScore(revenueData: any, expenseData: any): number {
  let score = 100;
  
  const netCashFlow = revenueData.totalRevenue - expenseData.totalExpenses;
  
  // Cash flow margin
  if (revenueData.totalRevenue > 0) {
    const cashFlowMargin = (netCashFlow / revenueData.totalRevenue) * 100;
    if (cashFlowMargin > 30) score += 25;
    else if (cashFlowMargin > 20) score += 15;
    else if (cashFlowMargin > 10) score += 5;
    else if (cashFlowMargin < 0) score -= 40;
    else if (cashFlowMargin < 5) score -= 15;
  }
  
  // Cash flow consistency
  const monthlyRevenue = Object.values(revenueData.revenueByPeriod);
  const monthlyExpenses = Object.values(expenseData.expensesByPeriod);
  
  if (monthlyRevenue.length >= 3 && monthlyExpenses.length >= 3) {
    let positiveMonths = 0;
    for (let i = 0; i < Math.min(monthlyRevenue.length, monthlyExpenses.length); i++) {
      if (monthlyRevenue[i] > monthlyExpenses[i]) positiveMonths++;
    }
    const consistencyRatio = positiveMonths / Math.min(monthlyRevenue.length, monthlyExpenses.length);
    
    if (consistencyRatio > 0.8) score += 15;
    else if (consistencyRatio > 0.6) score += 5;
    else if (consistencyRatio < 0.4) score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate customer health score
 */
function calculateCustomerScore(customerData: any): number {
  let score = 100;
  
  // Customer growth
  if (customerData.totalCustomers > 0) {
    const growthRate = (customerData.newCustomers / customerData.totalCustomers) * 100;
    if (growthRate > 20) score += 20;
    else if (growthRate > 10) score += 10;
    else if (growthRate < 5) score -= 10;
  }
  
  // Customer lifetime value
  if (customerData.customerLifetimeValue > 0) {
    // This is a simplified assessment - in practice, you'd compare to industry benchmarks
    if (customerData.customerLifetimeValue > 1000) score += 15;
    else if (customerData.customerLifetimeValue > 500) score += 10;
    else if (customerData.customerLifetimeValue < 100) score -= 10;
  }
  
  // Churn rate
  if (customerData.churnRate > 0) {
    if (customerData.churnRate < 5) score += 15;
    else if (customerData.churnRate < 10) score += 5;
    else if (customerData.churnRate > 20) score -= 25;
    else if (customerData.churnRate > 15) score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate operations health score
 */
function calculateOperationsScore(dataAdapter: DataAdapter): number {
  let score = 100;
  
  const productData = dataAdapter.getProductData();
  
  // Product diversity
  if (productData.totalProducts > 0) {
    if (productData.totalProducts >= 5) score += 15;
    else if (productData.totalProducts >= 3) score += 10;
    else if (productData.totalProducts === 1) score -= 15;
  }
  
  // Product concentration
  if (productData.topSellingProducts.length > 0) {
    const topProduct = productData.topSellingProducts[0];
    const totalRevenue = productData.topSellingProducts.reduce((sum, p) => sum + p.revenue, 0);
    const topProductPercentage = (topProduct.revenue / totalRevenue) * 100;
    
    if (topProductPercentage < 30) score += 10; // Good diversification
    else if (topProductPercentage > 70) score -= 15; // High concentration risk
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Identify health factors
 */
function identifyHealthFactors(
  revenueData: any,
  expenseData: any,
  customerData: any,
  dataAdapter: DataAdapter
): {
  positive: string[];
  negative: string[];
  recommendations: string[];
} {
  const positive: string[] = [];
  const negative: string[] = [];
  const recommendations: string[] = [];
  
  // Revenue factors
  if (revenueData.totalRevenue > 0) {
    const recurringPercentage = (revenueData.recurringRevenue / revenueData.totalRevenue) * 100;
    if (recurringPercentage > 70) {
      positive.push('Strong recurring revenue stream');
    } else if (recurringPercentage < 30) {
      negative.push('Low recurring revenue');
      recommendations.push('Consider implementing subscription models or retainer agreements');
    }
  }
  
  // Expense factors
  if (revenueData.totalRevenue > 0) {
    const expenseRatio = (expenseData.totalExpenses / revenueData.totalRevenue) * 100;
    if (expenseRatio < 60) {
      positive.push('Efficient cost management');
    } else if (expenseRatio > 80) {
      negative.push('High expense ratio');
      recommendations.push('Review and optimize your expense structure');
    }
  }
  
  // Cash flow factors
  const netCashFlow = revenueData.totalRevenue - expenseData.totalExpenses;
  if (netCashFlow > 0) {
    const cashFlowMargin = (netCashFlow / revenueData.totalRevenue) * 100;
    if (cashFlowMargin > 20) {
      positive.push('Healthy cash flow margin');
    } else if (cashFlowMargin < 5) {
      negative.push('Low cash flow margin');
      recommendations.push('Focus on increasing revenue or reducing expenses');
    }
  } else {
    negative.push('Negative cash flow');
    recommendations.push('Immediate action needed: reduce expenses or increase revenue');
  }
  
  // Customer factors
  if (customerData.churnRate > 0 && customerData.churnRate < 5) {
    positive.push('Low customer churn rate');
  } else if (customerData.churnRate > 15) {
    negative.push('High customer churn rate');
    recommendations.push('Investigate customer satisfaction and retention strategies');
  }
  
  if (customerData.customerLifetimeValue > 500) {
    positive.push('High customer lifetime value');
  }
  
  return { positive, negative, recommendations };
}

/**
 * Analyze trends in financial data
 */
export function analyzeTrends(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): TrendAnalysis {
  const revenueData = dataAdapter.getRevenueData();
  const expenseData = dataAdapter.getExpenseData();
  const customerData = dataAdapter.getCustomerData();
  
  // Analyze revenue trends
  const revenueTrend = analyzeRevenueTrend(revenueData);
  
  // Analyze expense trends
  const expenseTrend = analyzeExpenseTrend(expenseData);
  
  // Analyze cash flow trends
  const cashFlowTrend = analyzeCashFlowTrend(revenueData, expenseData);
  
  // Analyze customer trends
  const customerTrend = analyzeCustomerTrend(customerData);
  
  // Generate insights
  const insights = generateTrendInsights(
    revenueTrend,
    expenseTrend,
    cashFlowTrend,
    customerTrend
  );
  
  // Calculate confidence based on data quality
  const confidence = calculateTrendConfidence(transactions);
  
  return {
    period: 'Last 6 months',
    trends: {
      revenue: revenueTrend,
      expenses: expenseTrend,
      cashFlow: cashFlowTrend,
      customers: customerTrend
    },
    confidence,
    insights
  };
}

/**
 * Assess business risks
 */
export function assessBusinessRisks(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): RiskAssessment {
  const revenueData = dataAdapter.getRevenueData();
  const expenseData = dataAdapter.getExpenseData();
  const customerData = dataAdapter.getCustomerData();
  const productData = dataAdapter.getProductData();
  
  // Calculate risk factors
  const cashFlowRisk = calculateCashFlowRisk(revenueData, expenseData);
  const customerConcentrationRisk = calculateCustomerConcentrationRisk(customerData);
  const expenseRisk = calculateExpenseRisk(expenseData, revenueData);
  const revenueRisk = calculateRevenueRisk(revenueData, productData);
  
  // Determine overall risk level
  const avgRisk = (cashFlowRisk + customerConcentrationRisk + expenseRisk + revenueRisk) / 4;
  let level: 'low' | 'medium' | 'high' | 'critical';
  
  if (avgRisk < 25) level = 'low';
  else if (avgRisk < 50) level = 'medium';
  else if (avgRisk < 75) level = 'high';
  else level = 'critical';
  
  // Generate recommendations
  const recommendations = generateRiskRecommendations(
    cashFlowRisk,
    customerConcentrationRisk,
    expenseRisk,
    revenueRisk
  );
  
  return {
    level,
    factors: {
      cashFlowRisk,
      customerConcentrationRisk,
      expenseRisk,
      revenueRisk
    },
    recommendations
  };
}

// Helper functions for trend analysis
function analyzeRevenueTrend(revenueData: any): 'increasing' | 'decreasing' | 'stable' {
  const monthlyRevenue = Object.values(revenueData.revenueByPeriod);
  if (monthlyRevenue.length < 2) return 'stable';
  
  const recentMonths = monthlyRevenue.slice(-3);
  const previousMonths = monthlyRevenue.slice(-6, -3);
  
  if (recentMonths.length === 0 || previousMonths.length === 0) return 'stable';
  
  const recentAvg = recentMonths.reduce((a: number, b: number) => a + b, 0) / recentMonths.length;
  const previousAvg = previousMonths.reduce((a: number, b: number) => a + b, 0) / previousMonths.length;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

function analyzeExpenseTrend(expenseData: any): 'increasing' | 'decreasing' | 'stable' {
  const monthlyExpenses = Object.values(expenseData.expensesByPeriod);
  if (monthlyExpenses.length < 2) return 'stable';
  
  const recentMonths = monthlyExpenses.slice(-3);
  const previousMonths = monthlyExpenses.slice(-6, -3);
  
  if (recentMonths.length === 0 || previousMonths.length === 0) return 'stable';
  
  const recentAvg = recentMonths.reduce((a: number, b: number) => a + b, 0) / recentMonths.length;
  const previousAvg = previousMonths.reduce((a: number, b: number) => a + b, 0) / previousMonths.length;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

function analyzeCashFlowTrend(revenueData: any, expenseData: any): 'increasing' | 'decreasing' | 'stable' {
  const monthlyRevenue = Object.values(revenueData.revenueByPeriod);
  const monthlyExpenses = Object.values(expenseData.expensesByPeriod);
  
  if (monthlyRevenue.length < 2 || monthlyExpenses.length < 2) return 'stable';
  
  const recentRevenue = monthlyRevenue.slice(-3).reduce((a: number, b: number) => a + b, 0);
  const recentExpenses = monthlyExpenses.slice(-3).reduce((a: number, b: number) => a + b, 0);
  const previousRevenue = monthlyRevenue.slice(-6, -3).reduce((a: number, b: number) => a + b, 0);
  const previousExpenses = monthlyExpenses.slice(-6, -3).reduce((a: number, b: number) => a + b, 0);
  
  const recentCashFlow = recentRevenue - recentExpenses;
  const previousCashFlow = previousRevenue - previousExpenses;
  
  const change = ((recentCashFlow - previousCashFlow) / Math.abs(previousCashFlow)) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

function analyzeCustomerTrend(customerData: any): 'increasing' | 'decreasing' | 'stable' {
  if (customerData.totalCustomers === 0) return 'stable';
  
  const growthRate = (customerData.newCustomers / customerData.totalCustomers) * 100;
  
  if (growthRate > 10) return 'increasing';
  if (growthRate < 5) return 'decreasing';
  return 'stable';
}

function generateTrendInsights(
  revenueTrend: string,
  expenseTrend: string,
  cashFlowTrend: string,
  customerTrend: string
): string[] {
  const insights: string[] = [];
  
  if (revenueTrend === 'increasing' && expenseTrend === 'stable') {
    insights.push('Revenue is growing while expenses remain stable - excellent trend');
  } else if (revenueTrend === 'increasing' && expenseTrend === 'increasing') {
    insights.push('Both revenue and expenses are increasing - monitor profit margins');
  } else if (revenueTrend === 'decreasing' && expenseTrend === 'increasing') {
    insights.push('Revenue is declining while expenses are rising - immediate action needed');
  }
  
  if (cashFlowTrend === 'increasing') {
    insights.push('Cash flow is improving - good financial health indicator');
  } else if (cashFlowTrend === 'decreasing') {
    insights.push('Cash flow is declining - review revenue and expense management');
  }
  
  if (customerTrend === 'increasing') {
    insights.push('Customer base is growing - positive for long-term sustainability');
  } else if (customerTrend === 'decreasing') {
    insights.push('Customer growth is slowing - focus on customer acquisition and retention');
  }
  
  return insights;
}

function calculateTrendConfidence(transactions: Transaction[]): number {
  // Simplified confidence calculation based on data volume and recency
  if (transactions.length < 10) return 30;
  if (transactions.length < 50) return 60;
  if (transactions.length < 100) return 80;
  return 90;
}

// Helper functions for risk assessment
function calculateCashFlowRisk(revenueData: any, expenseData: any): number {
  const netCashFlow = revenueData.totalRevenue - expenseData.totalExpenses;
  
  if (netCashFlow < 0) return 90; // Critical risk
  
  const cashFlowMargin = (netCashFlow / revenueData.totalRevenue) * 100;
  
  if (cashFlowMargin < 5) return 70;
  if (cashFlowMargin < 10) return 50;
  if (cashFlowMargin < 20) return 30;
  return 10;
}

function calculateCustomerConcentrationRisk(customerData: any): number {
  // Simplified calculation - in practice, you'd analyze customer concentration
  if (customerData.totalCustomers < 5) return 80;
  if (customerData.totalCustomers < 10) return 60;
  if (customerData.totalCustomers < 20) return 40;
  return 20;
}

function calculateExpenseRisk(expenseData: any, revenueData: any): number {
  if (revenueData.totalRevenue === 0) return 100;
  
  const expenseRatio = (expenseData.totalExpenses / revenueData.totalRevenue) * 100;
  
  if (expenseRatio > 90) return 90;
  if (expenseRatio > 80) return 70;
  if (expenseRatio > 70) return 50;
  if (expenseRatio > 60) return 30;
  return 10;
}

function calculateRevenueRisk(revenueData: any, productData: any): number {
  let risk = 0;
  
  // Revenue concentration risk
  if (productData.topSellingProducts.length > 0) {
    const topProduct = productData.topSellingProducts[0];
    const totalRevenue = productData.topSellingProducts.reduce((sum: number, p: any) => sum + p.revenue, 0);
    const topProductPercentage = (topProduct.revenue / totalRevenue) * 100;
    
    if (topProductPercentage > 70) risk += 40;
    else if (topProductPercentage > 50) risk += 20;
  }
  
  // Revenue stability risk
  if (revenueData.recurringRevenue > 0) {
    const recurringPercentage = (revenueData.recurringRevenue / revenueData.totalRevenue) * 100;
    if (recurringPercentage < 30) risk += 30;
    else if (recurringPercentage < 50) risk += 15;
  }
  
  return Math.min(100, risk);
}

function generateRiskRecommendations(
  cashFlowRisk: number,
  customerConcentrationRisk: number,
  expenseRisk: number,
  revenueRisk: number
): string[] {
  const recommendations: string[] = [];
  
  if (cashFlowRisk > 70) {
    recommendations.push('Immediate action needed: improve cash flow through cost reduction or revenue increase');
  }
  
  if (customerConcentrationRisk > 60) {
    recommendations.push('Diversify customer base to reduce concentration risk');
  }
  
  if (expenseRisk > 70) {
    recommendations.push('Review and optimize expense structure to improve profitability');
  }
  
  if (revenueRisk > 60) {
    recommendations.push('Diversify revenue streams and increase recurring revenue');
  }
  
  return recommendations;
}
