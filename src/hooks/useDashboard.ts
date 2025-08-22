// Dashboard data hook for CashPilot

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardData, Transaction, Insight, AIInsight, FinancialHealthScore, CashFlowForecast } from '../types';

// Hook for dashboard overview data
export function useDashboardOverview(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'overview', days],
    queryFn: () => api.getDashboardOverview(days),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// Hook for transactions with pagination and filters
export function useTransactions(params: {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense' | 'transfer';
  startDate?: string;
  endDate?: string;
} = {}) {
  const { page = 1, limit = 20, ...filters } = params;

  return useQuery({
    queryKey: ['transactions', { page, limit, ...filters }],
    queryFn: () => api.getTransactions({ page, limit, ...filters }),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
  });
}

// Hook for analytics data
export function useAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api.getAnalytics(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for insights
export function useInsights(params: {
  type?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['insights', params],
    queryFn: () => api.getInsights(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for financial health scores
export function useScores(params: {
  period?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['scores', params],
    queryFn: () => api.getScores(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook for AI insight generation
export function useGenerateInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: 'daily' | 'weekly' | 'monthly';
      focus?: 'spending' | 'income' | 'savings' | 'general';
    }) => api.generateInsight(data),
    onSuccess: () => {
      // Invalidate insights queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
    onError: (error) => {
      console.error('Failed to generate insight:', error);
    },
  });
}

// Hook for calculating financial health score
export function useCalculateScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.calculateScore(),
    onSuccess: () => {
      // Invalidate scores queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['scores'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Failed to calculate score:', error);
    },
  });
}

// Hook for generating cash flow forecast
export function useGenerateForecast() {
  return useMutation({
    mutationFn: (data: { period: '30' | '60' | '90' }) => api.generateForecast(data),
    onError: (error) => {
      console.error('Failed to generate forecast:', error);
    },
  });
}

// Hook for AI insights history
export function useInsightsHistory(params: {
  type?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['ai-insights', 'history', params],
    queryFn: () => api.getInsightsHistory(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for refreshing dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Refetch all dashboard-related queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['dashboard'] }),
        queryClient.refetchQueries({ queryKey: ['transactions'] }),
        queryClient.refetchQueries({ queryKey: ['analytics'] }),
        queryClient.refetchQueries({ queryKey: ['insights'] }),
        queryClient.refetchQueries({ queryKey: ['scores'] }),
      ]);
    },
    onError: (error) => {
      console.error('Failed to refresh dashboard:', error);
    },
  });
}

// Hook for real-time dashboard updates
export function useDashboardUpdates() {
  const queryClient = useQueryClient();

  // Set up polling for real-time updates
  const { data: dashboardData } = useDashboardOverview();

  // Poll for updates every 30 seconds
  useQuery({
    queryKey: ['dashboard', 'polling'],
    queryFn: () => api.getDashboardOverview(30),
    refetchInterval: 30 * 1000, // 30 seconds
    refetchIntervalInBackground: true,
    onSuccess: (newData) => {
      // Update dashboard data if there are significant changes
      if (dashboardData && hasSignificantChanges(dashboardData, newData)) {
        queryClient.setQueryData(['dashboard', 'overview', 30], newData);
      }
    },
  });

  return { dashboardData };
}

// Utility function to check for significant changes
function hasSignificantChanges(oldData: DashboardData, newData: DashboardData): boolean {
  // Check if KPIs have changed by more than 1%
  const kpiThreshold = 0.01;
  
  const oldKPIs = oldData.kpis;
  const newKPIs = newData.kpis;

  const changes = [
    Math.abs((newKPIs.totalIncome - oldKPIs.totalIncome) / oldKPIs.totalIncome),
    Math.abs((newKPIs.totalExpenses - oldKPIs.totalExpenses) / oldKPIs.totalExpenses),
    Math.abs((newKPIs.netCashFlow - oldKPIs.netCashFlow) / Math.abs(oldKPIs.netCashFlow || 1)),
    Math.abs((newKPIs.savingsRate - oldKPIs.savingsRate) / oldKPIs.savingsRate),
  ];

  return changes.some(change => change > kpiThreshold);
}

// Hook for dashboard summary (for sidebar or quick view)
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const overview = await api.getDashboardOverview(7); // Last 7 days
      return {
        totalIncome: overview.kpis.totalIncome,
        totalExpenses: overview.kpis.totalExpenses,
        netCashFlow: overview.kpis.netCashFlow,
        recentTransactions: overview.recentTransactions.slice(0, 5),
        latestInsight: overview.insights[0],
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Hook for dashboard export functionality
export function useExportDashboard() {
  return useMutation({
    mutationFn: async (format: 'csv' | 'pdf' | 'excel') => {
      // This would call an export endpoint
      // For now, we'll simulate the export
      const dashboardData = await api.getDashboardOverview(30);
      
      // Simulate export processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        downloadUrl: `/api/export/dashboard.${format}`,
        filename: `cashpilot-dashboard-${new Date().toISOString().split('T')[0]}.${format}`,
      };
    },
    onError: (error) => {
      console.error('Failed to export dashboard:', error);
    },
  });
}

// Hook for dashboard sharing
export function useShareDashboard() {
  return useMutation({
    mutationFn: async (shareData: {
      email: string;
      message?: string;
      includeInsights?: boolean;
    }) => {
      // This would call a sharing endpoint
      // For now, we'll simulate the sharing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        shareId: `share_${Date.now()}`,
        message: 'Dashboard shared successfully',
      };
    },
    onError: (error) => {
      console.error('Failed to share dashboard:', error);
    },
  });
}

// Hook for dashboard notifications
export function useDashboardNotifications() {
  return useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: async () => {
      // This would fetch dashboard notifications
      // For now, we'll return mock data
      return [
        {
          id: '1',
          type: 'info' as const,
          title: 'New insight available',
          message: 'Your weekly financial insight is ready.',
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: '2',
          type: 'warning' as const,
          title: 'High spending alert',
          message: 'Your spending this week is 20% higher than average.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
      ];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
}
