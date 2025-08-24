// Financial calculation types and interfaces

export interface CashFlowData {
  income: number;
  expenses: number;
  netCashFlow: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
}

export interface KPICalculationResult {
  accountsReceivable: number;
  accountsPayable: number;
  netCashFlow: number;
  cashRunway: number; // days
  monthlyRecurringRevenue: number;
  customerLifetimeValue: number;
  churnRate: number;
  profitMargin: number;
  averageSaleValue: number;
  paymentCycle: number; // days
  activeCustomers: number;
  lastUpdated: Date;
}

export interface HealthScoreFactors {
  cashFlow: number; // 0-100
  profitability: number; // 0-100
  liquidity: number; // 0-100
  efficiency: number; // 0-100
  growth: number; // 0-100
}

export interface HealthScoreResult {
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: HealthScoreFactors;
  recommendations: string[];
  lastUpdated: Date;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  averageTransactionValue: number;
  largestTransaction: number;
  smallestTransaction: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
  type: 'income' | 'expense';
}

export interface TrendAnalysis {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}
