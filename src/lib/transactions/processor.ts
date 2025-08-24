import { Transaction } from '@/types';
import { categorizeTransaction } from './categorizer';

export interface TransactionInput {
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  type: 'income' | 'expense' | 'transfer';
  source: 'manual' | 'shopify' | 'quickbooks' | 'plaid';
  sourceId?: string;
  tags?: string[];
  attachments?: string[];
}

export interface ProcessingResult {
  transaction: Transaction;
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Process and validate a new transaction
 */
export function processTransaction(input: TransactionInput): ProcessingResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!input.userId) {
    errors.push('User ID is required');
  }

  if (!input.date) {
    errors.push('Date is required');
  }

  if (input.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!input.description.trim()) {
    errors.push('Description is required');
  }

  if (!input.currency) {
    errors.push('Currency is required');
  }

  // Validate date is not in the future
  if (input.date > new Date()) {
    warnings.push('Transaction date is in the future');
  }

  // Validate amount is reasonable
  if (input.amount > 1000000) {
    warnings.push('Transaction amount seems unusually high');
  }

  if (errors.length > 0) {
    return {
      transaction: {} as Transaction,
      success: false,
      errors,
      warnings
    };
  }

  // Auto-categorize if category not provided
  let category = input.category;
  if (!category) {
    category = categorizeTransaction(input.description, input.type, input.amount);
    warnings.push(`Auto-categorized as: ${category}`);
  }

  // Generate tags if not provided
  let tags = input.tags || [];
  if (tags.length === 0) {
    tags = generateTags(input.description, category, input.type);
  }

  // Create the transaction
  const transaction: Transaction = {
    id: generateTransactionId(),
    userId: input.userId,
    date: input.date,
    amount: input.amount,
    currency: input.currency,
    description: input.description.trim(),
    category,
    type: input.type,
    source: input.source,
    sourceId: input.sourceId,
    status: 'completed',
    tags,
    attachments: input.attachments || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    transaction,
    success: true,
    errors,
    warnings
  };
}

/**
 * Update an existing transaction
 */
export function updateTransaction(
  existingTransaction: Transaction,
  updates: Partial<TransactionInput>
): ProcessingResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate updates
  if (updates.amount !== undefined && updates.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (updates.description !== undefined && !updates.description.trim()) {
    errors.push('Description is required');
  }

  if (updates.date !== undefined && updates.date > new Date()) {
    warnings.push('Transaction date is in the future');
  }

  if (errors.length > 0) {
    return {
      transaction: existingTransaction,
      success: false,
      errors,
      warnings
    };
  }

  // Apply updates
  const updatedTransaction: Transaction = {
    ...existingTransaction,
    ...updates,
    updatedAt: new Date()
  };

  // Re-categorize if description changed
  if (updates.description && updates.description !== existingTransaction.description) {
    updatedTransaction.category = categorizeTransaction(
      updates.description,
      updatedTransaction.type,
      updatedTransaction.amount
    );
    warnings.push(`Re-categorized as: ${updatedTransaction.category}`);
  }

  return {
    transaction: updatedTransaction,
    success: true,
    errors,
    warnings
  };
}

/**
 * Validate transaction data
 */
export function validateTransaction(transaction: Transaction): ProcessingResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!transaction.userId) {
    errors.push('User ID is required');
  }

  if (!transaction.date) {
    errors.push('Date is required');
  }

  if (transaction.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!transaction.description.trim()) {
    errors.push('Description is required');
  }

  if (!transaction.currency) {
    errors.push('Currency is required');
  }

  if (!transaction.category) {
    errors.push('Category is required');
  }

  if (transaction.date > new Date()) {
    warnings.push('Transaction date is in the future');
  }

  if (transaction.amount > 1000000) {
    warnings.push('Transaction amount seems unusually high');
  }

  return {
    transaction,
    success: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate tags based on transaction data
 */
function generateTags(description: string, category: string, type: string): string[] {
  const tags: string[] = [];

  // Add type tag
  tags.push(type);

  // Add category tag
  tags.push(category.toLowerCase());

  // Add common business tags
  const businessKeywords = ['client', 'customer', 'invoice', 'payment', 'bill', 'expense'];
  const descriptionLower = description.toLowerCase();
  
  businessKeywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      tags.push(keyword);
    }
  });

  // Add amount-based tags
  if (type === 'income') {
    tags.push('revenue');
  } else if (type === 'expense') {
    tags.push('cost');
  }

  return [...new Set(tags)]; // Remove duplicates
}
