import { Transaction } from '@/types';
import { DataAdapter, DataSource } from '@/lib/calculations/dataAdapters';

export interface DataSourceProfile {
  source: DataSource;
  dataQuality: number;
  coverage: number;
  completeness: number;
  recency: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AdaptiveInsightStrategy {
  primarySource: DataSource;
  secondarySources: DataSource[];
  insightTypes: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  limitations: string[];
  recommendations: string[];
}

export interface DataQualityMetrics {
  overall: number;
  categories: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
  issues: string[];
  improvements: string[];
}

/**
 * Analyze data sources and determine optimal insight strategy
 */
export function analyzeDataSourcesForInsights(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): AdaptiveInsightStrategy {
  const profiles = generateDataSourceProfiles(transactions, dataAdapter);
  const primarySource = determinePrimarySource(profiles);
  const secondarySources = determineSecondarySources(profiles, primarySource);
  const insightTypes = determineInsightTypes(profiles, primarySource);
  const confidenceLevel = calculateConfidenceLevel(profiles);
  const limitations = identifyLimitations(profiles, primarySource);
  const recommendations = generateAdaptiveRecommendations(profiles, primarySource);
  
  return {
    primarySource,
    secondarySources,
    insightTypes,
    confidenceLevel,
    limitations,
    recommendations
  };
}

/**
 * Generate detailed profiles for each data source
 */
function generateDataSourceProfiles(
  transactions: Transaction[],
  dataAdapter: DataAdapter
): DataSourceProfile[] {
  const profiles: DataSourceProfile[] = [];
  
  // Analyze manual data
  const manualTransactions = transactions.filter(t => t.source === 'manual');
  if (manualTransactions.length > 0) {
    profiles.push({
      source: 'manual',
      dataQuality: calculateManualDataQuality(manualTransactions),
      coverage: calculateCoverage(manualTransactions, transactions),
      completeness: calculateCompleteness(manualTransactions),
      recency: calculateRecency(manualTransactions),
      accuracy: calculateAccuracy(manualTransactions),
      strengths: identifyManualStrengths(manualTransactions),
      weaknesses: identifyManualWeaknesses(manualTransactions),
      recommendations: generateManualRecommendations(manualTransactions)
    });
  }
  
  // Analyze Shopify data
  const shopifyTransactions = transactions.filter(t => t.source === 'shopify');
  if (shopifyTransactions.length > 0) {
    profiles.push({
      source: 'shopify',
      dataQuality: calculateShopifyDataQuality(shopifyTransactions),
      coverage: calculateCoverage(shopifyTransactions, transactions),
      completeness: calculateCompleteness(shopifyTransactions),
      recency: calculateRecency(shopifyTransactions),
      accuracy: calculateAccuracy(shopifyTransactions),
      strengths: identifyShopifyStrengths(shopifyTransactions),
      weaknesses: identifyShopifyWeaknesses(shopifyTransactions),
      recommendations: generateShopifyRecommendations(shopifyTransactions)
    });
  }
  
  // Analyze QuickBooks data
  const quickbooksTransactions = transactions.filter(t => t.source === 'quickbooks');
  if (quickbooksTransactions.length > 0) {
    profiles.push({
      source: 'quickbooks',
      dataQuality: calculateQuickBooksDataQuality(quickbooksTransactions),
      coverage: calculateCoverage(quickbooksTransactions, transactions),
      completeness: calculateCompleteness(quickbooksTransactions),
      recency: calculateRecency(quickbooksTransactions),
      accuracy: calculateAccuracy(quickbooksTransactions),
      strengths: identifyQuickBooksStrengths(quickbooksTransactions),
      weaknesses: identifyQuickBooksWeaknesses(quickbooksTransactions),
      recommendations: generateQuickBooksRecommendations(quickbooksTransactions)
    });
  }
  
  return profiles;
}

/**
 * Determine the primary data source for insights
 */
function determinePrimarySource(profiles: DataSourceProfile[]): DataSource {
  if (profiles.length === 0) return 'manual';
  
  // Score each source based on quality and coverage
  const scoredSources = profiles.map(profile => ({
    source: profile.source,
    score: (profile.dataQuality * 0.4) + (profile.coverage * 0.3) + (profile.completeness * 0.3)
  }));
  
  // Return the highest scoring source
  const bestSource = scoredSources.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  return bestSource.source;
}

/**
 * Determine secondary data sources
 */
function determineSecondarySources(profiles: DataSourceProfile[], primarySource: DataSource): DataSource[] {
  return profiles
    .filter(profile => profile.source !== primarySource)
    .map(profile => profile.source);
}

/**
 * Determine which types of insights can be generated
 */
function determineInsightTypes(profiles: DataSourceProfile[], primarySource: DataSource): string[] {
  const insightTypes: string[] = [];
  
  // Base insights available to all sources
  insightTypes.push('cash-flow-analysis', 'basic-financial-metrics');
  
  // Source-specific insights
  switch (primarySource) {
    case 'shopify':
      insightTypes.push(
        'e-commerce-performance',
        'customer-behavior',
        'product-analytics',
        'sales-trends',
        'inventory-insights'
      );
      break;
      
    case 'quickbooks':
      insightTypes.push(
        'accounting-insights',
        'expense-analysis',
        'tax-planning',
        'financial-reporting',
        'compliance-monitoring'
      );
      break;
      
    case 'manual':
      insightTypes.push(
        'custom-analysis',
        'flexible-reporting',
        'manual-tracking'
      );
      break;
      
    case 'combined':
      insightTypes.push(
        'comprehensive-analysis',
        'cross-platform-insights',
        'integrated-reporting',
        'holistic-view'
      );
      break;
  }
  
  return insightTypes;
}

/**
 * Calculate confidence level for insights
 */
function calculateConfidenceLevel(profiles: DataSourceProfile[]): 'high' | 'medium' | 'low' {
  if (profiles.length === 0) return 'low';
  
  const avgQuality = profiles.reduce((sum, p) => sum + p.dataQuality, 0) / profiles.length;
  const avgCoverage = profiles.reduce((sum, p) => sum + p.coverage, 0) / profiles.length;
  
  const overallScore = (avgQuality + avgCoverage) / 2;
  
  if (overallScore >= 80) return 'high';
  if (overallScore >= 60) return 'medium';
  return 'low';
}

/**
 * Identify limitations of the current data setup
 */
function identifyLimitations(profiles: DataSourceProfile[], primarySource: DataSource): string[] {
  const limitations: string[] = [];
  
  const primaryProfile = profiles.find(p => p.source === primarySource);
  if (!primaryProfile) {
    limitations.push('No primary data source available');
    return limitations;
  }
  
  // Coverage limitations
  if (primaryProfile.coverage < 50) {
    limitations.push(`Limited data coverage (${primaryProfile.coverage.toFixed(1)}%)`);
  }
  
  // Quality limitations
  if (primaryProfile.dataQuality < 70) {
    limitations.push(`Data quality issues may affect insight accuracy`);
  }
  
  // Completeness limitations
  if (primaryProfile.completeness < 80) {
    limitations.push(`Incomplete data may limit analysis depth`);
  }
  
  // Source-specific limitations
  switch (primarySource) {
    case 'manual':
      limitations.push('Manual data entry may have inconsistencies');
      limitations.push('Limited historical data available');
      break;
      
    case 'shopify':
      limitations.push('E-commerce focused - may miss other business activities');
      limitations.push('Limited expense tracking capabilities');
      break;
      
    case 'quickbooks':
      limitations.push('Accounting focused - may miss operational insights');
      limitations.push('Limited real-time data availability');
      break;
  }
  
  return limitations;
}

/**
 * Generate adaptive recommendations
 */
function generateAdaptiveRecommendations(
  profiles: DataSourceProfile[],
  primarySource: DataSource
): string[] {
  const recommendations: string[] = [];
  
  const primaryProfile = profiles.find(p => p.source === primarySource);
  if (!primaryProfile) {
    recommendations.push('Start by adding some transactions manually');
    return recommendations;
  }
  
  // Quality improvements
  if (primaryProfile.dataQuality < 80) {
    recommendations.push(...primaryProfile.recommendations);
  }
  
  // Coverage improvements
  if (primaryProfile.coverage < 70) {
    recommendations.push('Connect additional data sources for comprehensive insights');
  }
  
  // Source-specific recommendations
  switch (primarySource) {
    case 'manual':
      recommendations.push('Consider connecting Shopify for e-commerce insights');
      recommendations.push('Connect QuickBooks for comprehensive accounting data');
      break;
      
    case 'shopify':
      recommendations.push('Add manual transactions for non-e-commerce activities');
      recommendations.push('Connect QuickBooks for expense tracking and accounting');
      break;
      
    case 'quickbooks':
      recommendations.push('Connect Shopify for e-commerce sales data');
      recommendations.push('Add manual transactions for cash transactions');
      break;
      
    case 'combined':
      recommendations.push('Excellent data coverage - focus on data quality improvements');
      break;
  }
  
  return recommendations;
}

// Helper functions for data quality assessment
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
  
  // Check for inconsistent amounts
  const inconsistentAmounts = transactions.filter(t => 
    t.amount === 0 || isNaN(t.amount) || t.amount > 1000000
  );
  score -= (inconsistentAmounts.length / transactions.length) * 15;
  
  return Math.max(0, score);
}

function calculateShopifyDataQuality(transactions: Transaction[]): number {
  let score = 95; // Shopify data is generally high quality
  
  // Check for missing customer information
  const missingCustomerInfo = transactions.filter(t => 
    t.source === 'shopify' && (!t.description || !t.description.includes('Customer'))
  );
  score -= (missingCustomerInfo.length / transactions.length) * 10;
  
  return Math.max(0, score);
}

function calculateQuickBooksDataQuality(transactions: Transaction[]): number {
  let score = 90; // QuickBooks data is generally high quality
  
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

function calculateRecency(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  
  const now = new Date();
  const recentTransactions = transactions.filter(t => {
    const daysDiff = (now.getTime() - t.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  });
  
  return (recentTransactions.length / transactions.length) * 100;
}

function calculateAccuracy(transactions: Transaction[]): number {
  let score = 100;
  
  // Check for obvious errors
  const errors = transactions.filter(t => 
    t.amount === 0 || 
    isNaN(t.amount) || 
    t.amount > 1000000 || 
    !t.date || 
    t.date > new Date()
  );
  
  score -= (errors.length / transactions.length) * 100;
  
  return Math.max(0, score);
}

// Helper functions for identifying strengths and weaknesses
function identifyManualStrengths(transactions: Transaction[]): string[] {
  const strengths: string[] = [];
  
  if (transactions.length > 50) {
    strengths.push('Comprehensive transaction history');
  }
  
  const categorizedTransactions = transactions.filter(t => t.category && t.category !== 'Uncategorized');
  if (categorizedTransactions.length / transactions.length > 0.8) {
    strengths.push('Well-categorized transactions');
  }
  
  return strengths;
}

function identifyManualWeaknesses(transactions: Transaction[]): string[] {
  const weaknesses: string[] = [];
  
  const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized');
  if (uncategorized.length > 0) {
    weaknesses.push(`${uncategorized.length} uncategorized transactions`);
  }
  
  const missingDescriptions = transactions.filter(t => !t.description || t.description.length < 3);
  if (missingDescriptions.length > 0) {
    weaknesses.push(`${missingDescriptions.length} transactions with poor descriptions`);
  }
  
  return weaknesses;
}

function generateManualRecommendations(transactions: Transaction[]): string[] {
  const recommendations: string[] = [];
  
  const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized');
  if (uncategorized.length > 0) {
    recommendations.push('Categorize uncategorized transactions');
  }
  
  const missingDescriptions = transactions.filter(t => !t.description || t.description.length < 3);
  if (missingDescriptions.length > 0) {
    recommendations.push('Add descriptions to transactions');
  }
  
  return recommendations;
}

function identifyShopifyStrengths(transactions: Transaction[]): string[] {
  return [
    'Automated data collection',
    'Real-time sales data',
    'Customer information included',
    'Consistent data format'
  ];
}

function identifyShopifyWeaknesses(transactions: Transaction[]): string[] {
  return [
    'Limited to e-commerce activities',
    'No expense tracking',
    'May miss cash transactions'
  ];
}

function generateShopifyRecommendations(transactions: Transaction[]): string[] {
  return [
    'Connect additional data sources for comprehensive view',
    'Add manual transactions for non-e-commerce activities'
  ];
}

function identifyQuickBooksStrengths(transactions: Transaction[]): string[] {
  return [
    'Professional accounting data',
    'Comprehensive expense tracking',
    'Tax-ready information',
    'High data accuracy'
  ];
}

function identifyQuickBooksWeaknesses(transactions: Transaction[]): string[] {
  return [
    'Limited real-time updates',
    'Accounting-focused view',
    'May miss operational insights'
  ];
}

function generateQuickBooksRecommendations(transactions: Transaction[]): string[] {
  return [
    'Connect e-commerce platforms for sales data',
    'Add manual transactions for cash activities'
  ];
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
