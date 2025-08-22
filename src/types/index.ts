// CashPilot TypeScript Types

// User and Authentication Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  companyName: string;
  role: 'admin' | 'user';
  subscription: Subscription;
  integrations: Integrations;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  startDate: Date;
  endDate: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface Integrations {
  shopify: ShopifyIntegration | null;
  quickbooks: QuickBooksIntegration | null;
  plaid: PlaidIntegration | null;
}

export interface ShopifyIntegration {
  shopId: string;
  shopName: string;
  accessToken: string;
  isActive: boolean;
  lastSync: Date;
  webhookUrl?: string;
}

export interface QuickBooksIntegration {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  lastSync: Date;
}

export interface PlaidIntegration {
  accessToken: string;
  itemId: string;
  institutionName: string;
  accounts: PlaidAccount[];
  isActive: boolean;
  lastSync: Date;
}

export interface PlaidAccount {
  accountId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'loan';
  mask: string;
  balance: number;
}

export interface UserSettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  timezone: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  paymentReminders: boolean;
  lowBalanceAlerts: boolean;
  weeklyReports: boolean;
}

// Financial Data Types
export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  source: 'manual' | 'shopify' | 'quickbooks' | 'plaid';
  sourceId?: string;
  status: 'pending' | 'completed' | 'failed';
  tags: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIs {
  accountsReceivable: number;
  accountsPayable: number;
  netCashFlow: number;
  cashRunway: number; // days
  monthlyRecurringRevenue: number;
  customerLifetimeValue: number;
  churnRate: number;
  lastUpdated: Date;
}

export interface CashFlowForecast {
  userId: string;
  date: Date;
  forecast30Days: number;
  forecast60Days: number;
  forecast90Days: number;
  confidence: number; // 0-1
  factors: ForecastFactor[];
  lastUpdated: Date;
}

export interface ForecastFactor {
  name: string;
  impact: number; // positive or negative
  confidence: number;
  description: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  type: 'health_score' | 'payment_reminder' | 'expense_optimization' | 'growth_opportunity';
  title: string;
  content: string;
  score: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  actionItems: ActionItem[];
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
  completedAt?: Date;
}

export interface FinancialHealthScore {
  userId: string;
  date: Date;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    cashFlow: number;
    profitability: number;
    liquidity: number;
    efficiency: number;
  };
  factors: HealthFactor[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  trend: 'improving' | 'stable' | 'declining';
}

// Dashboard and UI Types
export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'insight' | 'transaction_list';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  isVisible: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

// API and Integration Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  companyName: string;
}

export interface TransactionForm {
  date: Date;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  tags: string[];
}

// Error Types
export interface FirebaseError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Component Props Types
export interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  loading?: boolean;
}

export interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  options?: Record<string, any>;
  loading?: boolean;
}

export interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  showPagination?: boolean;
}

// Firebase Security Rules Types
export interface FirestoreRules {
  users: {
    [uid: string]: {
      read: boolean;
      write: boolean;
    };
  };
  transactions: {
    [transactionId: string]: {
      read: boolean;
      write: boolean;
    };
  };
  kpis: {
    [uid: string]: {
      read: boolean;
      write: boolean;
    };
  };
}

// Environment and Configuration Types
export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  stripe: {
    publishableKey: string;
  };
  integrations: {
    shopify: {
      clientId: string;
      scopes: string[];
    };
    quickbooks: {
      clientId: string;
      clientSecret: string;
    };
    plaid: {
      clientId: string;
      secret: string;
      env: string;
    };
  };
}

// Export all types
export type {
  UserProfile,
  Subscription,
  Integrations,
  ShopifyIntegration,
  QuickBooksIntegration,
  PlaidIntegration,
  PlaidAccount,
  UserSettings,
  NotificationSettings,
  Transaction,
  KPIs,
  CashFlowForecast,
  ForecastFactor,
  AIInsight,
  ActionItem,
  FinancialHealthScore,
  HealthFactor,
  DashboardWidget,
  ChartData,
  APIResponse,
  PaginationParams,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  TransactionForm,
  FirebaseError,
  ValidationError,
  LoadingState,
  LoadingData,
  KPICardProps,
  ChartProps,
  TransactionListProps,
  FirestoreRules,
  AppConfig
};
