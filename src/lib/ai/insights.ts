import { Transaction } from '@/types';
import { DataAdapter, RevenueData, ExpenseData, CustomerData, ProductData } from '@/lib/calculations/dataAdapters';

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'critical' | 'opportunity' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'revenue' | 'expenses' | 'cash-flow' | 'customers' | 'operations' | 'growth';
  data?: any;
  actionable: boolean;
  actionItems?: string[];
  confidence: number; // 0-100
  createdAt: Date;
}

export interface InsightAnalysis {
  insights: Insight[];
  summary: {
    totalInsights: number;
    positiveInsights: number;
    warningInsights: number;
    criticalInsights: number;
    opportunities: number;
  };
  recommendations: string[];
  healthScore: number; // 0-100
  dataQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export interface DataSourceAnalysis {
  source: string;
  dataQuality: number;
  coverage: number;
  completeness: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Analyze available data sources and determine insights strategy
 */
export function analyzeDataSources(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): DataSourceAnalysis[] {
  const sources = new Map<string, DataSourceAnalysis>();
  
  // Analyze manual data
  const manualTransactions = transactions.filter(t => t.source === 'manual');
  if (manualTransactions.length > 0) {
    sources.set('manual', {
      source: 'Manual Entry',
      dataQuality: calculateManualDataQuality(manualTransactions),
      coverage: calculateCoverage(manualTransactions, transactions),
      completeness: calculateCompleteness(manualTransactions),
      issues: identifyManualDataIssues(manualTransactions),
      recommendations: generateManualRecommendations(manualTransactions)
    });
  }
  
  // Analyze Shopify data
  const shopifyTransactions = transactions.filter(t => t.source === 'shopify');
  if (shopifyTransactions.length > 0) {
    sources.set('shopify', {
      source: 'Shopify',
      dataQuality: calculateShopifyDataQuality(shopifyTransactions),
      coverage: calculateCoverage(shopifyTransactions, transactions),
      completeness: calculateCompleteness(shopifyTransactions),
      issues: identifyShopifyDataIssues(shopifyTransactions),
      recommendations: generateShopifyRecommendations(shopifyTransactions)
    });
  }
  
  // Analyze QuickBooks data
  const quickbooksTransactions = transactions.filter(t => t.source === 'quickbooks');
  if (quickbooksTransactions.length > 0) {
    sources.set('quickbooks', {
      source: 'QuickBooks',
      dataQuality: calculateQuickBooksDataQuality(quickbooksTransactions),
      coverage: calculateCoverage(quickbooksTransactions, transactions),
      completeness: calculateCompleteness(quickbooksTransactions),
      issues: identifyQuickBooksDataIssues(quickbooksTransactions),
      recommendations: generateQuickBooksRecommendations(quickbooksTransactions)
    });
  }
  
  return Array.from(sources.values());
}

/**
 * Generate AI-powered insights based on available data
 */
export function generateInsights(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): InsightAnalysis {
  const insights: Insight[] = [];
  const dataSources = analyzeDataSources(transactions, dataAdapter);
  
  // Revenue insights
  const revenueInsights = generateRevenueInsights(dataAdapter);
  insights.push(...revenueInsights);
  
  // Expense insights
  const expenseInsights = generateExpenseInsights(dataAdapter);
  insights.push(...expenseInsights);
  
  // Cash flow insights
  const cashFlowInsights = generateCashFlowInsights(dataAdapter);
  insights.push(...cashFlowInsights);
  
  // Customer insights
  const customerInsights = generateCustomerInsights(dataAdapter);
  insights.push(...customerInsights);
  
  // Operational insights
  const operationalInsights = generateOperationalInsights(dataAdapter);
  insights.push(...operationalInsights);
  
  // Data quality insights
  const dataQualityInsights = generateDataQualityInsights(dataSources);
  insights.push(...dataQualityInsights);
  
  // Calculate summary
  const summary = {
    totalInsights: insights.length,
    positiveInsights: insights.filter(i => i.type === 'positive').length,
    warningInsights: insights.filter(i => i.type === 'warning').length,
    criticalInsights: insights.filter(i => i.type === 'critical').length,
    opportunities: insights.filter(i => i.type === 'opportunity').length
  };
  
  // Generate recommendations
  const recommendations = generateRecommendations(insights, dataSources);
  
  // Calculate health score
  const healthScore = calculateHealthScore(insights, dataSources);
  
  // Assess data quality
  const dataQuality = assessOverallDataQuality(dataSources);
  
  return {
    insights,
    summary,
    recommendations,
    healthScore,
    dataQuality
  };
}

/**
 * Generate revenue-focused insights
 */
function generateRevenueInsights(dataAdapter: DataAdapter): Insight[] {
  const insights: Insight[] = [];
  const revenueData = dataAdapter.getRevenueData();
  
  // Revenue growth analysis
  if (revenueData.totalRevenue > 0) {
    const monthlyRevenue = Object.values(revenueData.revenueByPeriod);
    if (monthlyRevenue.length >= 2) {
      const recentMonths = monthlyRevenue.slice(-3);
      const previousMonths = monthlyRevenue.slice(-6, -3);
      
      if (recentMonths.length > 0 && previousMonths.length > 0) {
        const recentAvg = recentMonths.reduce((a, b) => a + b, 0) / recentMonths.length;
        const previousAvg = previousMonths.reduce((a, b) => a + b, 0) / previousMonths.length;
        const growthRate = ((recentAvg - previousAvg) / previousAvg) * 100;
        
        if (growthRate > 10) {
          insights.push({
            id: `revenue_growth_${Date.now()}`,
            type: 'positive',
            title: 'Strong Revenue Growth',
            description: `Your revenue has grown by ${growthRate.toFixed(1)}% in the last 3 months compared to the previous 3 months.`,
            impact: 'high',
            category: 'revenue',
            actionable: true,
            actionItems: [
              'Analyze what\'s driving this growth',
              'Consider scaling successful strategies',
              'Plan for continued growth'
            ],
            confidence: 85,
            createdAt: new Date()
          });
        } else if (growthRate < -10) {
          insights.push({
            id: `revenue_decline_${Date.now()}`,
            type: 'warning',
            title: 'Revenue Decline Detected',
            description: `Your revenue has declined by ${Math.abs(growthRate).toFixed(1)}% in the last 3 months.`,
            impact: 'high',
            category: 'revenue',
            actionable: true,
            actionItems: [
              'Investigate the cause of decline',
              'Review customer retention strategies',
              'Consider new revenue streams'
            ],
            confidence: 80,
            createdAt: new Date()
          });
        }
      }
    }
  }
  
  // Recurring revenue analysis
  if (revenueData.recurringRevenue > 0) {
    const recurringPercentage = (revenueData.recurringRevenue / revenueData.totalRevenue) * 100;
    
    if (recurringPercentage > 70) {
      insights.push({
        id: `recurring_revenue_high_${Date.now()}`,
        type: 'positive',
        title: 'Strong Recurring Revenue',
        description: `${recurringPercentage.toFixed(1)}% of your revenue is recurring, providing stable cash flow.`,
        impact: 'medium',
        category: 'revenue',
        actionable: false,
        confidence: 90,
        createdAt: new Date()
      });
    } else if (recurringPercentage < 30) {
      insights.push({
        id: `recurring_revenue_low_${Date.now()}`,
        type: 'opportunity',
        title: 'Opportunity: Increase Recurring Revenue',
        description: `Only ${recurringPercentage.toFixed(1)}% of your revenue is recurring. Consider subscription models or retainer agreements.`,
        impact: 'medium',
        category: 'revenue',
        actionable: true,
        actionItems: [
          'Explore subscription-based services',
          'Consider retainer agreements with clients',
          'Implement recurring billing for existing services'
        ],
        confidence: 75,
        createdAt: new Date()
      });
    }
  }
  
  return insights;
}

/**
 * Generate expense-focused insights
 */
function generateExpenseInsights(dataAdapter: DataAdapter): Insight[] {
  const insights: Insight[] = [];
  const expenseData = dataAdapter.getExpenseData();
  
  // Expense ratio analysis
  const revenueData = dataAdapter.getRevenueData();
  if (expenseData.totalExpenses > 0 && revenueData.totalRevenue > 0) {
    const expenseRatio = (expenseData.totalExpenses / revenueData.totalRevenue) * 100;
    
    if (expenseRatio > 80) {
      insights.push({
        id: `expense_ratio_high_${Date.now()}`,
        type: 'critical',
        title: 'High Expense Ratio',
        description: `Your expenses are ${expenseRatio.toFixed(1)}% of revenue, which may impact profitability.`,
        impact: 'high',
        category: 'expenses',
        actionable: true,
        actionItems: [
          'Review and reduce unnecessary expenses',
          'Negotiate better rates with suppliers',
          'Consider cost-cutting measures'
        ],
        confidence: 85,
        createdAt: new Date()
      });
    } else if (expenseRatio < 50) {
      insights.push({
        id: `expense_ratio_low_${Date.now()}`,
        type: 'positive',
        title: 'Efficient Cost Management',
        description: `Your expenses are only ${expenseRatio.toFixed(1)}% of revenue, indicating good cost control.`,
        impact: 'medium',
        category: 'expenses',
        actionable: false,
        confidence: 90,
        createdAt: new Date()
      });
    }
  }
  
  // Expense category analysis
  const topExpenseCategories = Object.entries(expenseData.expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  if (topExpenseCategories.length > 0) {
    const [topCategory, topAmount] = topExpenseCategories[0];
    const topPercentage = (topAmount / expenseData.totalExpenses) * 100;
    
    if (topPercentage > 40) {
      insights.push({
        id: `expense_concentration_${Date.now()}`,
        type: 'warning',
        title: 'Expense Concentration Risk',
        description: `${topCategory} represents ${topPercentage.toFixed(1)}% of your total expenses.`,
        impact: 'medium',
        category: 'expenses',
        actionable: true,
        actionItems: [
          'Diversify expense categories',
          'Negotiate better rates for this category',
          'Explore alternative suppliers'
        ],
        confidence: 80,
        createdAt: new Date()
      });
    }
  }
  
  return insights;
}

/**
 * Generate cash flow insights
 */
function generateCashFlowInsights(dataAdapter: DataAdapter): Insight[] {
  const insights: Insight[] = [];
  const revenueData = dataAdapter.getRevenueData();
  const expenseData = dataAdapter.getExpenseData();
  
  const netCashFlow = revenueData.totalRevenue - expenseData.totalExpenses;
  
  if (netCashFlow < 0) {
    insights.push({
      id: `negative_cash_flow_${Date.now()}`,
      type: 'critical',
      title: 'Negative Cash Flow',
      description: 'Your expenses exceed your revenue, creating negative cash flow.',
      impact: 'high',
      category: 'cash-flow',
      actionable: true,
      actionItems: [
        'Immediately reduce expenses',
        'Increase revenue through new sales',
        'Consider short-term financing options'
      ],
      confidence: 95,
      createdAt: new Date()
    });
  } else if (netCashFlow > 0) {
    const cashFlowMargin = (netCashFlow / revenueData.totalRevenue) * 100;
    
    if (cashFlowMargin > 30) {
      insights.push({
        id: `strong_cash_flow_${Date.now()}`,
        type: 'positive',
        title: 'Strong Cash Flow',
        description: `You have a healthy ${cashFlowMargin.toFixed(1)}% cash flow margin.`,
        impact: 'medium',
        category: 'cash-flow',
        actionable: false,
        confidence: 90,
        createdAt: new Date()
      });
    }
  }
  
  return insights;
}

/**
 * Generate customer-focused insights
 */
function generateCustomerInsights(dataAdapter: DataAdapter): Insight[] {
  const insights: Insight[] = [];
  const customerData = dataAdapter.getCustomerData();
  
  // Customer growth analysis
  if (customerData.newCustomers > 0) {
    const growthRate = (customerData.newCustomers / customerData.totalCustomers) * 100;
    
    if (growthRate > 20) {
      insights.push({
        id: `customer_growth_${Date.now()}`,
        type: 'positive',
        title: 'Strong Customer Growth',
        description: `You've added ${customerData.newCustomers} new customers, a ${growthRate.toFixed(1)}% growth rate.`,
        impact: 'medium',
        category: 'customers',
        actionable: false,
        confidence: 85,
        createdAt: new Date()
      });
    }
  }
  
  // Customer lifetime value analysis
  if (customerData.customerLifetimeValue > 0) {
    const revenueData = dataAdapter.getRevenueData();
    const averageOrderValue = revenueData.averageOrderValue;
    
    if (customerData.customerLifetimeValue > averageOrderValue * 5) {
      insights.push({
        id: `high_clv_${Date.now()}`,
        type: 'positive',
        title: 'High Customer Lifetime Value',
        description: `Your customers have a high lifetime value of $${customerData.customerLifetimeValue.toFixed(2)}.`,
        impact: 'medium',
        category: 'customers',
        actionable: true,
        actionItems: [
          'Focus on customer retention',
          'Develop loyalty programs',
          'Cross-sell to existing customers'
        ],
        confidence: 80,
        createdAt: new Date()
      });
    }
  }
  
  // Churn rate analysis
  if (customerData.churnRate > 0) {
    if (customerData.churnRate > 10) {
      insights.push({
        id: `high_churn_${Date.now()}`,
        type: 'warning',
        title: 'High Customer Churn Rate',
        description: `Your churn rate is ${customerData.churnRate.toFixed(1)}%, which may indicate customer satisfaction issues.`,
        impact: 'high',
        category: 'customers',
        actionable: true,
        actionItems: [
          'Survey customers about their experience',
          'Improve customer support',
          'Review product/service quality'
        ],
        confidence: 75,
        createdAt: new Date()
      });
    }
  }
  
  return insights;
}

/**
 * Generate operational insights
 */
function generateOperationalInsights(dataAdapter: DataAdapter): Insight[] {
  const insights: Insight[] = [];
  const productData = dataAdapter.getProductData();
  
  // Product performance analysis
  if (productData.topSellingProducts.length > 0) {
    const topProduct = productData.topSellingProducts[0];
    const totalRevenue = productData.topSellingProducts.reduce((sum, p) => sum + p.revenue, 0);
    const topProductPercentage = (topProduct.revenue / totalRevenue) * 100;
    
    if (topProductPercentage > 50) {
      insights.push({
        id: `product_concentration_${Date.now()}`,
        type: 'warning',
        title: 'Product Concentration Risk',
        description: `${topProduct.name} represents ${topProductPercentage.toFixed(1)}% of your product revenue.`,
        impact: 'medium',
        category: 'operations',
        actionable: true,
        actionItems: [
          'Diversify your product portfolio',
          'Develop new products or services',
          'Reduce dependency on single product'
        ],
        confidence: 80,
        createdAt: new Date()
      });
    }
  }
  
  return insights;
}

/**
 * Generate data quality insights
 */
function generateDataQualityInsights(dataSources: DataSourceAnalysis[]): Insight[] {
  const insights: Insight[] = [];
  
  dataSources.forEach(source => {
    if (source.dataQuality < 70) {
      insights.push({
        id: `data_quality_${source.source.toLowerCase()}_${Date.now()}`,
        type: 'warning',
        title: `Data Quality Issues in ${source.source}`,
        description: `Your ${source.source} data has quality issues that may affect insights accuracy.`,
        impact: 'medium',
        category: 'operations',
        actionable: true,
        actionItems: source.recommendations,
        confidence: 70,
        createdAt: new Date()
      });
    }
    
    if (source.coverage < 50) {
      insights.push({
        id: `data_coverage_${source.source.toLowerCase()}_${Date.now()}`,
        type: 'opportunity',
        title: `Improve ${source.source} Data Coverage`,
        description: `Only ${source.coverage.toFixed(1)}% of your transactions come from ${source.source}.`,
        impact: 'low',
        category: 'operations',
        actionable: true,
        actionItems: [
          'Import more data from this source',
          'Connect additional accounts',
          'Consider manual entry for missing data'
        ],
        confidence: 85,
        createdAt: new Date()
      });
    }
  });
  
  return insights;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(insights: Insight[], dataSources: DataSourceAnalysis[]): string[] {
  const recommendations: string[] = [];
  
  // High-impact recommendations
  const criticalInsights = insights.filter(i => i.impact === 'high' && i.actionable);
  criticalInsights.forEach(insight => {
    if (insight.actionItems) {
      recommendations.push(...insight.actionItems);
    }
  });
  
  // Data quality recommendations
  const lowQualitySources = dataSources.filter(s => s.dataQuality < 70);
  lowQualitySources.forEach(source => {
    recommendations.push(`Improve data quality in ${source.source}: ${source.recommendations[0]}`);
  });
  
  // Growth recommendations
  const opportunityInsights = insights.filter(i => i.type === 'opportunity');
  opportunityInsights.forEach(insight => {
    if (insight.actionItems) {
      recommendations.push(insight.actionItems[0]);
    }
  });
  
  return recommendations.slice(0, 10); // Limit to top 10 recommendations
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(insights: Insight[], dataSources: DataSourceAnalysis[]): number {
  let score = 100;
  
  // Deduct points for critical issues
  const criticalInsights = insights.filter(i => i.type === 'critical');
  score -= criticalInsights.length * 15;
  
  // Deduct points for warnings
  const warningInsights = insights.filter(i => i.type === 'warning');
  score -= warningInsights.length * 5;
  
  // Add points for positive insights
  const positiveInsights = insights.filter(i => i.type === 'positive');
  score += positiveInsights.length * 3;
  
  // Deduct points for poor data quality
  const lowQualitySources = dataSources.filter(s => s.dataQuality < 70);
  score -= lowQualitySources.length * 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Assess overall data quality
 */
function assessOverallDataQuality(dataSources: DataSourceAnalysis[]): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  if (dataSources.length === 0) {
    return {
      score: 0,
      issues: ['No data sources available'],
      suggestions: ['Start by adding some transactions manually or connecting integrations']
    };
  }
  
  const avgQuality = dataSources.reduce((sum, s) => sum + s.dataQuality, 0) / dataSources.length;
  const avgCoverage = dataSources.reduce((sum, s) => sum + s.coverage, 0) / dataSources.length;
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (avgQuality < 70) {
    issues.push('Overall data quality is below recommended levels');
    suggestions.push('Review and clean your transaction data');
  }
  
  if (avgCoverage < 50) {
    issues.push('Limited data coverage across sources');
    suggestions.push('Connect more data sources or add manual transactions');
  }
  
  dataSources.forEach(source => {
    if (source.issues.length > 0) {
      issues.push(`${source.source}: ${source.issues[0]}`);
    }
    if (source.recommendations.length > 0) {
      suggestions.push(`${source.source}: ${source.recommendations[0]}`);
    }
  });
  
  return {
    score: Math.round((avgQuality + avgCoverage) / 2),
    issues,
    suggestions
  };
}

// Helper functions for data source analysis
function calculateManualDataQuality(transactions: Transaction[]): number {
  let score = 100;
  
  // Check for missing descriptions
  const missingDescriptions = transactions.filter(t => !t.description || t.description.length < 3);
  score -= (missingDescriptions.length / transactions.length) * 30;
  
  // Check for uncategorized transactions
  const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized');
  score -= (uncategorized.length / transactions.length) * 25;
  
  // Check for duplicate transactions
  const duplicates = findDuplicateTransactions(transactions);
  score -= (duplicates.length / transactions.length) * 20;
  
  return Math.max(0, score);
}

function calculateShopifyDataQuality(transactions: Transaction[]): number {
  let score = 100;
  
  // Shopify data is generally high quality
  // Check for missing customer information
  const missingCustomerInfo = transactions.filter(t => 
    t.source === 'shopify' && (!t.description || !t.description.includes('Customer'))
  );
  score -= (missingCustomerInfo.length / transactions.length) * 10;
  
  return Math.max(0, score);
}

function calculateQuickBooksDataQuality(transactions: Transaction[]): number {
  let score = 100;
  
  // QuickBooks data is generally high quality
  // Check for proper categorization
  const uncategorized = transactions.filter(t => 
    t.source === 'quickbooks' && (!t.category || t.category === 'Uncategorized')
  );
  score -= (uncategorized.length / transactions.length) * 15;
  
  return Math.max(0, score);
}

function calculateCoverage(sourceTransactions: Transaction[], allTransactions: Transaction[]): number {
  if (allTransactions.length === 0) return 0;
  return (sourceTransactions.length / allTransactions.length) * 100;
}

function calculateCompleteness(transactions: Transaction[]): number {
  let score = 100;
  
  // Check for missing required fields
  const incomplete = transactions.filter(t => 
    !t.description || !t.category || !t.amount || isNaN(t.amount)
  );
  score -= (incomplete.length / transactions.length) * 100;
  
  return Math.max(0, score);
}

function identifyManualDataIssues(transactions: Transaction[]): string[] {
  const issues: string[] = [];
  
  const missingDescriptions = transactions.filter(t => !t.description || t.description.length < 3);
  if (missingDescriptions.length > 0) {
    issues.push(`${missingDescriptions.length} transactions have missing or short descriptions`);
  }
  
  const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized');
  if (uncategorized.length > 0) {
    issues.push(`${uncategorized.length} transactions are not categorized`);
  }
  
  return issues;
}

function generateManualRecommendations(transactions: Transaction[]): string[] {
  const recommendations: string[] = [];
  
  const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized');
  if (uncategorized.length > 0) {
    recommendations.push('Categorize uncategorized transactions for better insights');
  }
  
  const missingDescriptions = transactions.filter(t => !t.description || t.description.length < 3);
  if (missingDescriptions.length > 0) {
    recommendations.push('Add descriptions to transactions for better tracking');
  }
  
  return recommendations;
}

function identifyShopifyDataIssues(transactions: Transaction[]): string[] {
  return []; // Shopify data is generally clean
}

function generateShopifyRecommendations(transactions: Transaction[]): string[] {
  return ['Consider connecting additional Shopify stores for comprehensive data'];
}

function identifyQuickBooksDataIssues(transactions: Transaction[]): string[] {
  const issues: string[] = [];
  
  const uncategorized = transactions.filter(t => 
    t.source === 'quickbooks' && (!t.category || t.category === 'Uncategorized')
  );
  if (uncategorized.length > 0) {
    issues.push(`${uncategorized.length} QuickBooks transactions need categorization`);
  }
  
  return issues;
}

function generateQuickBooksRecommendations(transactions: Transaction[]): string[] {
  return ['Sync more historical data from QuickBooks for better trend analysis'];
}

function findDuplicateTransactions(transactions: Transaction[]): Transaction[] {
  const duplicates: Transaction[] = [];
  const seen = new Set<string>();
  
  transactions.forEach(transaction => {
    const key = `${transaction.date.toISOString().split('T')[0]}_${transaction.amount}_${transaction.description}`;
    if (seen.has(key)) {
      duplicates.push(transaction);
    } else {
      seen.add(key);
    }
  });
  
  return duplicates;
}
