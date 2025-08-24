// Export all transaction processing functions

export {
  processTransaction,
  updateTransaction,
  validateTransaction,
  type ProcessingResult,
  type TransactionInput
} from './processor';

export {
  categorizeTransaction,
  getAvailableCategories,
  getCategoriesByType,
  suggestCategories,
  learnFromUserCategorization
} from './categorizer';
