export interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Integration {
    id: string;
    userId: string;
    provider: 'plaid' | 'quickbooks' | 'shopify';
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Transaction {
    id: string;
    userId: string;
    integrationId?: string;
    externalId?: string;
    amount: number;
    currency: string;
    description: string;
    category: string;
    transactionDate: Date;
    type: 'income' | 'expense' | 'transfer';
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface Insight {
    id: string;
    userId: string;
    type: 'daily' | 'weekly' | 'monthly';
    title: string;
    content: string;
    score?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface Score {
    id: string;
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    score: number;
    metrics: Record<string, any>;
    createdAt: Date;
}
export interface Subscription {
    id: string;
    userId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status: 'trial' | 'active' | 'canceled' | 'past_due' | 'unpaid';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
    lastPaymentDate?: Date;
    lastPaymentFailed?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface DashboardData {
    kpis: {
        totalIncome: number;
        totalExpenses: number;
        netCashFlow: number;
        savingsRate: number;
        transactionCount: number;
    };
    recentTransactions: Transaction[];
    chartData: ChartDataPoint[];
    insights: Insight[];
    score: Score;
}
export interface ChartDataPoint {
    date: string;
    income: number;
    expenses: number;
    net: number;
}
export interface KPI {
    title: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    color: 'green' | 'red' | 'blue' | 'yellow';
}
export interface PlaidAccount {
    accountId: string;
    name: string;
    type: string;
    subtype: string;
    mask: string;
    balances: {
        available: number;
        current: number;
        limit?: number;
    };
}
export interface QuickBooksAccount {
    id: string;
    name: string;
    accountType: string;
    accountSubType: string;
    balance: number;
    currency: string;
}
export interface ShopifyOrder {
    id: string;
    orderNumber: string;
    totalPrice: string;
    currency: string;
    createdAt: string;
    financialStatus: string;
    fulfillmentStatus: string;
}
export interface FinancialHealthScore {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    explanation: string;
    recommendations: string[];
    metrics: {
        savingsRate: number;
        cashFlow: number;
        debtToIncome: number;
        emergencyFund: number;
    };
}
export interface CashFlowForecast {
    period: '30' | '60' | '90';
    data: {
        date: string;
        projectedIncome: number;
        projectedExpenses: number;
        projectedNet: number;
        confidence: number;
    }[];
}
export interface AIInsight {
    id: string;
    title: string;
    content: string;
    score: number;
    category: 'positive' | 'warning' | 'recommendation';
    metadata: {
        recommendation?: string;
        positiveObservation?: string;
        keyMetrics?: Record<string, any>;
    };
}
export interface AuthRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
}
export interface JwtPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}
export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
}
export interface ValidationError {
    field: string;
    message: string;
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
export interface StripeWebhookEvent {
    id: string;
    type: string;
    data: {
        object: any;
    };
    created: number;
}
export interface PlaidWebhookEvent {
    webhook_type: string;
    webhook_code: string;
    item_id: string;
    environment: string;
    error?: any;
}
export interface EnvironmentVariables {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    JWT_SECRET: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    PLAID_CLIENT_ID: string;
    PLAID_SECRET: string;
    PLAID_ENV: 'sandbox' | 'development' | 'production';
    QUICKBOOKS_CLIENT_ID: string;
    QUICKBOOKS_SECRET: string;
    SHOPIFY_CLIENT_ID: string;
    SHOPIFY_CLIENT_SECRET: string;
    CLAUDE_API_KEY: string;
}
//# sourceMappingURL=index.d.ts.map