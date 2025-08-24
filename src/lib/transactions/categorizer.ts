import { Transaction } from '@/types';

// Category mapping for automatic categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Income categories
  'Client Services': ['client', 'consulting', 'service', 'project', 'work', 'contract'],
  'Product Sales': ['sale', 'product', 'item', 'merchandise', 'goods'],
  'Subscription': ['subscription', 'recurring', 'monthly', 'annual', 'membership'],
  'Investment': ['investment', 'dividend', 'interest', 'return', 'profit'],
  'Refund': ['refund', 'return', 'credit', 'reimbursement'],
  'Other Income': ['commission', 'bonus', 'tip', 'gift'],

  // Expense categories
  'Office & Supplies': ['office', 'supplies', 'stationery', 'paper', 'ink', 'printer'],
  'Technology': ['software', 'hardware', 'computer', 'laptop', 'phone', 'internet', 'hosting'],
  'Marketing': ['marketing', 'advertising', 'promotion', 'social media', 'seo', 'ppc'],
  'Travel': ['travel', 'flight', 'hotel', 'transportation', 'uber', 'lyft', 'gas'],
  'Meals': ['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'coffee'],
  'Professional Services': ['legal', 'accounting', 'consultant', 'freelancer', 'contractor'],
  'Insurance': ['insurance', 'liability', 'health', 'property'],
  'Rent': ['rent', 'lease', 'office space', 'warehouse'],
  'Utilities': ['electricity', 'water', 'gas', 'utility', 'power'],
  'Salaries': ['salary', 'payroll', 'wage', 'employee', 'staff'],
  'Taxes': ['tax', 'irs', 'state tax', 'local tax'],
  'Bank Fees': ['bank fee', 'transaction fee', 'atm fee', 'overdraft'],
  'Other Expenses': ['miscellaneous', 'other', 'general']
};

// Priority categories (checked first)
const PRIORITY_CATEGORIES = [
  'Client Services',
  'Product Sales',
  'Technology',
  'Marketing',
  'Office & Supplies'
];

/**
 * Automatically categorize a transaction based on description
 */
export function categorizeTransaction(
  description: string,
  type: 'income' | 'expense' | 'transfer',
  amount: number
): string {
  const descriptionLower = description.toLowerCase();

  // Check priority categories first
  for (const category of PRIORITY_CATEGORIES) {
    if (matchesCategory(descriptionLower, category)) {
      return category;
    }
  }

  // Check all categories
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (matchesCategory(descriptionLower, category)) {
      return category;
    }
  }

  // Default categories based on type
  if (type === 'income') {
    return 'Other Income';
  } else if (type === 'expense') {
    return 'Other Expenses';
  } else {
    return 'Transfer';
  }
}

/**
 * Check if description matches a category
 */
function matchesCategory(description: string, category: string): boolean {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords) return false;

  return keywords.some(keyword => description.includes(keyword));
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): string[] {
  return Object.keys(CATEGORY_KEYWORDS);
}

/**
 * Get categories by type
 */
export function getCategoriesByType(type: 'income' | 'expense' | 'transfer'): string[] {
  const allCategories = getAvailableCategories();
  
  if (type === 'income') {
    return allCategories.filter(cat => 
      ['Client Services', 'Product Sales', 'Subscription', 'Investment', 'Refund', 'Other Income'].includes(cat)
    );
  } else if (type === 'expense') {
    return allCategories.filter(cat => 
      !['Client Services', 'Product Sales', 'Subscription', 'Investment', 'Refund', 'Other Income'].includes(cat)
    );
  } else {
    return ['Transfer'];
  }
}

/**
 * Suggest categories based on description
 */
export function suggestCategories(description: string): string[] {
  const descriptionLower = description.toLowerCase();
  const suggestions: Array<{ category: string; score: number }> = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    
    keywords.forEach(keyword => {
      if (descriptionLower.includes(keyword)) {
        score += 1;
      }
    });

    if (score > 0) {
      suggestions.push({ category, score });
    }
  }

  // Sort by score (highest first) and return top 3
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.category);
}

/**
 * Learn from user categorization to improve future suggestions
 */
export function learnFromUserCategorization(
  description: string,
  userCategory: string,
  transactions: Transaction[]
): void {
  // This would typically update a machine learning model
  // For now, we'll just log the learning
  console.log(`Learning: "${description}" -> "${userCategory}"`);
  
  // In a real implementation, this would:
  // 1. Store the mapping in a database
  // 2. Update keyword weights
  // 3. Retrain the categorization model
}
