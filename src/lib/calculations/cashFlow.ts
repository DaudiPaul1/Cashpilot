import { Transaction } from '@/types';
import { CashFlowData, TransactionSummary, CategoryBreakdown, TrendAnalysis } from '@/types/financial';

/**
 * Calculate cash flow data for a given period
 */
export function calculateCashFlow(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
): CashFlowData {
  const filteredTransactions = transactions.filter(
    transaction => transaction.date >= startDate && transaction.date <= endDate
  );

  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = income - expenses;

  return {
    income,
    expenses,
    netCashFlow,
    period,
    startDate,
    endDate
  };
}

/**
 * Calculate transaction summary statistics
 */
export function calculateTransactionSummary(transactions: Transaction[]): TransactionSummary {
  if (transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      transactionCount: 0,
      averageTransactionValue: 0,
      largestTransaction: 0,
      smallestTransaction: 0
    };
  }

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const amounts = transactions.map(t => t.amount);
  const averageTransactionValue = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netCashFlow: income - expenses,
    transactionCount: transactions.length,
    averageTransactionValue,
    largestTransaction: Math.max(...amounts),
    smallestTransaction: Math.min(...amounts)
  };
}

/**
 * Calculate category breakdown for transactions
 */
export function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, { total: number; count: number; type: 'income' | 'expense' }>();

  transactions.forEach(transaction => {
    const key = transaction.category;
    const existing = categoryMap.get(key) || { total: 0, count: 0, type: transaction.type };
    
    categoryMap.set(key, {
      total: existing.total + transaction.amount,
      count: existing.count + 1,
      type: transaction.type
    });
  });

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
    type: data.type
  })).sort((a, b) => b.total - a.total);
}

/**
 * Calculate trend analysis between two periods
 */
export function calculateTrendAnalysis(
  currentPeriodTransactions: Transaction[],
  previousPeriodTransactions: Transaction[]
): TrendAnalysis {
  const currentTotal = currentPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
  const previousTotal = previousPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);

  const change = currentTotal - previousTotal;
  const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (changePercentage > 5) {
    trend = 'increasing';
  } else if (changePercentage < -5) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  return {
    currentPeriod: currentTotal,
    previousPeriod: previousTotal,
    change,
    changePercentage,
    trend
  };
}

/**
 * Calculate accounts receivable (money owed to the business)
 */
export function calculateAccountsReceivable(transactions: Transaction[]): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return transactions
    .filter(t => 
      t.type === 'income' && 
      t.status === 'pending' && 
      t.date >= thirtyDaysAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate accounts payable (money the business owes)
 */
export function calculateAccountsPayable(transactions: Transaction[]): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return transactions
    .filter(t => 
      t.type === 'expense' && 
      t.status === 'pending' && 
      t.date >= thirtyDaysAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate cash runway in days
 */
export function calculateCashRunway(
  currentCash: number,
  monthlyExpenses: number
): number {
  if (monthlyExpenses <= 0) return Infinity;
  
  const dailyExpenses = monthlyExpenses / 30;
  return Math.floor(currentCash / dailyExpenses);
}

/**
 * Calculate monthly recurring revenue
 */
export function calculateMonthlyRecurringRevenue(transactions: Transaction[]): number {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return transactions
    .filter(t => 
      t.type === 'income' && 
      t.date >= lastMonth && 
      t.date < thisMonth
    )
    .reduce((sum, t) => sum + t.amount, 0);
}
