import { Transaction, KPIs } from '@/types';
import { KPICalculationResult, TransactionSummary, CategoryBreakdown } from '@/types/financial';
import { 
  calculateCashFlow, 
  calculateAccountsReceivable, 
  calculateAccountsPayable,
  calculateCashRunway,
  calculateMonthlyRecurringRevenue,
  calculateTransactionSummary,
  calculateCategoryBreakdown
} from './cashFlow';
import { createDataAdapter, DataAdapter } from './dataAdapters';

/**
 * Calculate all KPIs from transaction data
 */
export function calculateKPIs(transactions: Transaction[], shopifyOrders: any[] = []): KPICalculationResult {
  if (transactions.length === 0) {
    return {
      accountsReceivable: 0,
      accountsPayable: 0,
      netCashFlow: 0,
      cashRunway: 0,
      monthlyRecurringRevenue: 0,
      customerLifetimeValue: 0,
      churnRate: 0,
      profitMargin: 0,
      averageSaleValue: 0,
      paymentCycle: 0,
      activeCustomers: 0,
      lastUpdated: new Date()
    };
  }

  // Calculate basic cash flow metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cashFlowData = calculateCashFlow(transactions, thirtyDaysAgo, now, 'monthly');

  // Calculate accounts receivable and payable
  const accountsReceivable = calculateAccountsReceivable(transactions);
  const accountsPayable = calculateAccountsPayable(transactions);

  // Calculate cash runway
  const monthlyExpenses = cashFlowData.expenses;
  const currentCash = cashFlowData.netCashFlow;
  const cashRunway = calculateCashRunway(currentCash, monthlyExpenses);

  // Calculate monthly recurring revenue
  const monthlyRecurringRevenue = calculateMonthlyRecurringRevenue(transactions);

  // Create data adapter for flexible calculations
  const dataAdapter = createDataAdapter(transactions, shopifyOrders);
  
  // Calculate customer metrics using data adapter
  const customerMetrics = calculateCustomerMetricsWithAdapter(dataAdapter);

  // Calculate profit margin
  const profitMargin = cashFlowData.income > 0 
    ? ((cashFlowData.income - cashFlowData.expenses) / cashFlowData.income) * 100 
    : 0;

  // Calculate average sale value
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const averageSaleValue = incomeTransactions.length > 0
    ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length
    : 0;

  // Calculate payment cycle (average days to get paid)
  const paymentCycle = calculatePaymentCycle(transactions);

  return {
    accountsReceivable,
    accountsPayable,
    netCashFlow: cashFlowData.netCashFlow,
    cashRunway,
    monthlyRecurringRevenue,
    customerLifetimeValue: customerMetrics.lifetimeValue,
    churnRate: customerMetrics.churnRate,
    profitMargin,
    averageSaleValue,
    paymentCycle,
    activeCustomers: customerMetrics.activeCustomers,
    lastUpdated: new Date()
  };
}

/**
 * Calculate customer-related metrics using data adapter
 */
function calculateCustomerMetricsWithAdapter(dataAdapter: DataAdapter): {
  activeCustomers: number;
  lifetimeValue: number;
  churnRate: number;
} {
  // Use data adapter to get customer metrics
  const customerData = dataAdapter.getCustomerData();
  
  return {
    activeCustomers: customerData.activeCustomers,
    lifetimeValue: customerData.customerLifetimeValue,
    churnRate: customerData.churnRate * 100 // Convert to percentage
  };

  return {
    activeCustomers,
    lifetimeValue,
    churnRate
  };
}

/**
 * Calculate average payment cycle in days
 */
function calculatePaymentCycle(transactions: Transaction[]): number {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  if (incomeTransactions.length === 0) return 0;

  // For now, using a simplified calculation
  // In a real implementation, this would track invoice dates vs payment dates
  const now = new Date();
  const averageDays = incomeTransactions.reduce((sum, t) => {
    const daysDiff = Math.floor((now.getTime() - t.date.getTime()) / (1000 * 60 * 60 * 24));
    return sum + daysDiff;
  }, 0) / incomeTransactions.length;

  return Math.round(averageDays);
}

/**
 * Convert KPICalculationResult to KPIs interface for compatibility
 */
export function convertToKPIs(kpiResult: KPICalculationResult): KPIs {
  return {
    accountsReceivable: kpiResult.accountsReceivable,
    accountsPayable: kpiResult.accountsPayable,
    netCashFlow: kpiResult.netCashFlow,
    cashRunway: kpiResult.cashRunway,
    monthlyRecurringRevenue: kpiResult.monthlyRecurringRevenue,
    customerLifetimeValue: kpiResult.customerLifetimeValue,
    churnRate: kpiResult.churnRate,
    lastUpdated: kpiResult.lastUpdated
  };
}

/**
 * Calculate KPI trends (month-over-month changes)
 */
export function calculateKPITrends(
  currentKPIs: KPICalculationResult,
  previousKPIs: KPICalculationResult
): Record<keyof KPICalculationResult, { change: number; changePercentage: number }> {
  const trends: any = {};

  Object.keys(currentKPIs).forEach(key => {
    if (key === 'lastUpdated') return;

    const current = currentKPIs[key as keyof KPICalculationResult] as number;
    const previous = previousKPIs[key as keyof KPICalculationResult] as number;

    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

    trends[key] = { change, changePercentage };
  });

  return trends;
}
