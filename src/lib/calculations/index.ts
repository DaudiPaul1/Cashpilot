// Export all calculation functions for easy importing

// Cash Flow Calculations
export {
  calculateCashFlow,
  calculateTransactionSummary,
  calculateCategoryBreakdown,
  calculateTrendAnalysis,
  calculateAccountsReceivable,
  calculateAccountsPayable,
  calculateCashRunway,
  calculateMonthlyRecurringRevenue
} from './cashFlow';

// KPI Calculations
export {
  calculateKPIs,
  convertToKPIs,
  calculateKPITrends
} from './kpiCalculations';

// Health Score Calculations
export {
  calculateHealthScore
} from './healthScore';

// Re-export types
export type {
  CashFlowData,
  KPICalculationResult,
  HealthScoreResult,
  TransactionSummary,
  CategoryBreakdown,
  TrendAnalysis,
  HealthScoreFactors
} from '@/types/financial';

// Data Adapters
export {
  createDataAdapter,
  ManualDataAdapter,
  ShopifyDataAdapter,
  QuickBooksDataAdapter,
  CombinedDataAdapter
} from './dataAdapters';

export type {
  DataAdapter,
  DataSource,
  RevenueData,
  ExpenseData,
  CustomerData,
  ProductData
} from './dataAdapters';
