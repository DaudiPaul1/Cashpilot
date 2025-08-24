import { z } from 'zod';

// Base schemas
export const UserSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional().or(z.literal('')),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const TransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  date: z.date(),
  amount: z.number().finite('Amount must be a valid number'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  type: z.enum(['income', 'expense', 'transfer'], {
    errorMap: () => ({ message: 'Type must be income, expense, or transfer' })
  }),
  source: z.enum(['manual', 'shopify', 'quickbooks'], {
    errorMap: () => ({ message: 'Source must be manual, shopify, or quickbooks' })
  }),
  sourceId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be pending, completed, or cancelled' })
  }),
  tags: z.array(z.string()).max(20, 'Too many tags'),
  attachments: z.array(z.string()).max(10, 'Too many attachments'),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const TransactionInputSchema = z.object({
  date: z.string().datetime().or(z.date()),
  amount: z.number().finite('Amount must be a valid number'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  type: z.enum(['income', 'expense', 'transfer'], {
    errorMap: () => ({ message: 'Type must be income, expense, or transfer' })
  }),
  source: z.enum(['manual', 'shopify', 'quickbooks'], {
    errorMap: () => ({ message: 'Source must be manual, shopify, or quickbooks' })
  }).default('manual'),
  sourceId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be pending, completed, or cancelled' })
  }).default('completed'),
  tags: z.array(z.string()).max(20, 'Too many tags').default([]),
  attachments: z.array(z.string()).max(10, 'Too many attachments').default([])
});

// API request schemas
export const CreateTransactionSchema = z.object({
  transaction: TransactionInputSchema
});

export const UpdateTransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  updates: TransactionInputSchema.partial()
});

export const BulkImportSchema = z.object({
  transactions: z.array(TransactionInputSchema).max(1000, 'Too many transactions')
});

// Integration schemas
export const ShopifyCredentialsSchema = z.object({
  shopDomain: z.string().min(1, 'Shop domain is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  apiVersion: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid API version format').default('2024-01')
});

export const QuickBooksCredentialsSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  realmId: z.string().min(1, 'Realm ID is required')
});

// AI Insights schemas
export const AIInsightsRequestSchema = z.object({
  transactions: z.array(TransactionSchema).max(10000, 'Too many transactions'),
  shopifyOrders: z.array(z.any()).max(1000, 'Too many Shopify orders').default([]),
  quickbooksInvoices: z.array(z.any()).max(1000, 'Too many QuickBooks invoices').default([]),
  quickbooksBills: z.array(z.any()).max(1000, 'Too many QuickBooks bills').default([])
});

// CSV Import schemas
export const CSVRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().finite('Amount must be a valid number'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  type: z.enum(['income', 'expense', 'transfer'], {
    errorMap: () => ({ message: 'Type must be income, expense, or transfer' })
  }),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('USD'),
  tags: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

// User settings schemas
export const UserSettingsSchema = z.object({
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  timezone: z.string().min(1, 'Timezone is required').default('UTC'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], {
    errorMap: () => ({ message: 'Invalid date format' })
  }).default('MM/DD/YYYY'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    insights: z.boolean().default(true),
    reminders: z.boolean().default(true)
  }).default({}),
  integrations: z.object({
    shopify: z.boolean().default(false),
    quickbooks: z.boolean().default(false)
  }).default({})
});

// Search and filter schemas
export const TransactionSearchSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  source: z.enum(['manual', 'shopify', 'quickbooks']).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['date', 'amount', 'description', 'category']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0).optional()
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
  code: z.string().optional()
});

// Success response schema
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional()
});

// Rate limiting schemas
export const RateLimitSchema = z.object({
  limit: z.number().int().min(1),
  remaining: z.number().int().min(0),
  reset: z.number().int().min(0),
  retryAfter: z.number().int().min(0).optional()
});

// Validation helper functions
export const validateTransaction = (data: unknown) => {
  return TransactionSchema.safeParse(data);
};

export const validateTransactionInput = (data: unknown) => {
  return TransactionInputSchema.safeParse(data);
};

export const validateBulkImport = (data: unknown) => {
  return BulkImportSchema.safeParse(data);
};

export const validateAIInsightsRequest = (data: unknown) => {
  return AIInsightsRequestSchema.safeParse(data);
};

export const validateCSVRow = (data: unknown) => {
  return CSVRowSchema.safeParse(data);
};

export const validateUserSettings = (data: unknown) => {
  return UserSettingsSchema.safeParse(data);
};

export const validateTransactionSearch = (data: unknown) => {
  return TransactionSearchSchema.safeParse(data);
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeAmount = (amount: number): number => {
  return Math.round(amount * 100) / 100; // Round to 2 decimal places
};

export const sanitizeDate = (date: string | Date): Date => {
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const sanitizeTransactionInput = (input: any) => {
  return {
    ...input,
    description: sanitizeString(input.description || ''),
    category: sanitizeString(input.category || ''),
    amount: sanitizeAmount(input.amount || 0),
    date: sanitizeDate(input.date),
    tags: (input.tags || []).map(sanitizeString).filter(Boolean),
    attachments: (input.attachments || []).filter((url: string) => 
      url && typeof url === 'string' && url.length > 0
    )
  };
};

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof UpdateTransactionSchema>;
export type BulkImportRequest = z.infer<typeof BulkImportSchema>;
export type ShopifyCredentials = z.infer<typeof ShopifyCredentialsSchema>;
export type QuickBooksCredentials = z.infer<typeof QuickBooksCredentialsSchema>;
export type AIInsightsRequest = z.infer<typeof AIInsightsRequestSchema>;
export type CSVRow = z.infer<typeof CSVRowSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type TransactionSearch = z.infer<typeof TransactionSearchSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type RateLimit = z.infer<typeof RateLimitSchema>;
