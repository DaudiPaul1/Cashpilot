// API client for CashPilot frontend

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  User, 
  DashboardData, 
  Transaction, 
  Insight, 
  AIInsight, 
  FinancialHealthScore, 
  CashFlowForecast,
  Integration,
  Subscription,
  StripePrice,
  PaginatedResponse,
  LoginCredentials,
  RegisterData
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cashpilot_token');
    }
    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashpilot_token', token);
    }
  }

  private clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cashpilot_token');
    }
  }

  // Generic API call helper
  private async apiCall<T>(method: string, url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request({
        method,
        url,
        data,
      });

      if (response.data.success) {
        return response.data.data as T;
      } else {
        throw new Error(response.data.error || 'API request failed');
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Network error');
    }
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await this.apiCall<{ user: User; token: string }>('POST', '/api/auth/register', data);
    this.setAuthToken(response.token);
    return response;
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await this.apiCall<{ user: User; token: string }>('POST', '/api/auth/login', credentials);
    this.setAuthToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.apiCall('POST', '/api/auth/logout');
    } finally {
      this.clearAuthToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return await this.apiCall<User>('GET', '/api/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return await this.apiCall<User>('PUT', '/api/auth/profile', data);
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; user: User }> {
    const response = await this.apiCall<{ token: string; user: User }>('POST', '/api/auth/refresh', { refreshToken });
    this.setAuthToken(response.token);
    return response;
  }

  // Dashboard endpoints
  async getDashboardOverview(days: number = 30): Promise<DashboardData> {
    return await this.apiCall<DashboardData>('GET', `/api/dashboard/overview?days=${days}`);
  }

  async getTransactions(params: {
    page?: number;
    limit?: number;
    type?: 'income' | 'expense' | 'transfer';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Transaction>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return await this.apiCall<PaginatedResponse<Transaction>>('GET', `/api/dashboard/transactions?${queryParams}`);
  }

  async getAnalytics(days: number = 30): Promise<{
    spendingBreakdown: any[];
    incomeBreakdown: any[];
    healthScore: number;
    period: string;
  }> {
    return await this.apiCall('GET', `/api/dashboard/analytics?days=${days}`);
  }

  async getInsights(params: {
    type?: 'daily' | 'weekly' | 'monthly';
    limit?: number;
  } = {}): Promise<{ insights: Insight[]; type: string }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return await this.apiCall('GET', `/api/dashboard/insights?${queryParams}`);
  }

  async getScores(params: {
    period?: 'daily' | 'weekly' | 'monthly';
    limit?: number;
  } = {}): Promise<{ scores: any[]; period: string }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return await this.apiCall('GET', `/api/dashboard/scores?${queryParams}`);
  }

  // AI endpoints
  async generateInsight(data: {
    type: 'daily' | 'weekly' | 'monthly';
    focus?: 'spending' | 'income' | 'savings' | 'general';
  }): Promise<{ insight: AIInsight; generatedAt: string }> {
    return await this.apiCall('POST', '/api/ai/generate-insight', data);
  }

  async calculateScore(): Promise<{ score: FinancialHealthScore; calculatedAt: string }> {
    return await this.apiCall('POST', '/api/ai/calculate-score');
  }

  async generateForecast(data: { period: '30' | '60' | '90' }): Promise<{ forecast: CashFlowForecast; generatedAt: string }> {
    return await this.apiCall('POST', '/api/ai/forecast', data);
  }

  async getInsightsHistory(params: {
    type?: 'daily' | 'weekly' | 'monthly';
    limit?: number;
  } = {}): Promise<{ insights: AIInsight[]; total: number }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return await this.apiCall('GET', `/api/ai/insights-history?${queryParams}`);
  }

  // Integration endpoints
  async getIntegrations(): Promise<{ integrations: Integration[] }> {
    return await this.apiCall('GET', '/api/integrations');
  }

  async createPlaidLinkToken(): Promise<{ linkToken: string; expiresAt: string }> {
    return await this.apiCall('POST', '/api/integrations/plaid/link-token');
  }

  async exchangePlaidToken(data: {
    publicToken: string;
    metadata: any;
  }): Promise<{ integration: Integration; message: string }> {
    return await this.apiCall('POST', '/api/integrations/plaid/exchange-token', data);
  }

  async connectQuickBooks(data: {
    code: string;
    realmId: string;
  }): Promise<{ integration: Integration; message: string }> {
    return await this.apiCall('POST', '/api/integrations/quickbooks/auth', data);
  }

  async connectShopify(data: {
    shop: string;
    code: string;
  }): Promise<{ integration: Integration; message: string }> {
    return await this.apiCall('POST', '/api/integrations/shopify/auth', data);
  }

  async disconnectIntegration(id: string): Promise<{ message: string }> {
    return await this.apiCall('DELETE', `/api/integrations/${id}`);
  }

  async syncIntegration(id: string): Promise<{ syncedAt: string; recordsSynced: number }> {
    return await this.apiCall('POST', `/api/integrations/${id}/sync`);
  }

  async getIntegrationStatus(id: string): Promise<{
    integration: Integration;
    status: string;
    lastSync: string;
    nextSync: string;
  }> {
    return await this.apiCall('GET', `/api/integrations/${id}/status`);
  }

  // Stripe endpoints
  async createSubscription(data: {
    priceId: string;
    paymentMethodId?: string;
  }): Promise<{
    subscriptionId: string;
    clientSecret?: string;
    status: string;
  }> {
    return await this.apiCall('POST', '/api/stripe/create-subscription', data);
  }

  async getSubscription(): Promise<{
    subscription: Subscription | null;
    status: string;
  }> {
    return await this.apiCall('GET', '/api/stripe/subscription');
  }

  async cancelSubscription(data: { cancelAtPeriodEnd: boolean }): Promise<{
    subscription: any;
    canceledAt: string | null;
  }> {
    return await this.apiCall('POST', '/api/stripe/cancel-subscription', data);
  }

  async updatePaymentMethod(data: { paymentMethodId: string }): Promise<{ message: string }> {
    return await this.apiCall('POST', '/api/stripe/update-payment-method', data);
  }

  async getPrices(): Promise<{ prices: StripePrice[] }> {
    return await this.apiCall('GET', '/api/stripe/prices');
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    environment: string;
    database: string;
    version: string;
  }> {
    return await this.apiCall('GET', '/api/health');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

// Create and export singleton instance
export const api = new ApiClient();

// Export types for convenience
export type { ApiResponse, User, DashboardData, Transaction, Insight, AIInsight };
