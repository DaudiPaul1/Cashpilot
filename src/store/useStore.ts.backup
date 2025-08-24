import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Transaction, AIInsight, KPIs } from '@/types';

// UI State
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  modals: {
    [key: string]: boolean;
  };
}

// Dashboard State
interface DashboardState {
  selectedDateRange: '7d' | '30d' | '90d' | '1y';
  selectedView: 'overview' | 'transactions' | 'insights' | 'settings';
  filters: {
    transactionType?: 'income' | 'expense' | 'transfer';
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    dateFrom?: Date;
    dateTo?: Date;
  };
  sortBy: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Data State
interface DataState {
  transactions: Transaction[];
  insights: AIInsight[];
  kpis: KPIs | null;
  loading: {
    transactions: boolean;
    insights: boolean;
    kpis: boolean;
  };
  error: {
    transactions: string | null;
    insights: string | null;
    kpis: string | null;
  };
}

// Notification Type
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
}

// Combined Store State
interface StoreState extends UIState, DashboardState, DataState {
  // UI Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;

  // Dashboard Actions
  setDateRange: (range: '7d' | '30d' | '90d' | '1y') => void;
  setView: (view: 'overview' | 'transactions' | 'insights' | 'settings') => void;
  setFilters: (filters: Partial<DashboardState['filters']>) => void;
  clearFilters: () => void;
  setSortBy: (field: string, direction: 'asc' | 'desc') => void;

  // Data Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setInsights: (insights: AIInsight[]) => void;
  addInsight: (insight: AIInsight) => void;
  removeInsight: (id: string) => void;
  setKPIs: (kpis: KPIs) => void;
  setLoading: (key: keyof DataState['loading'], loading: boolean) => void;
  setError: (key: keyof DataState['error'], error: string | null) => void;
  clearErrors: () => void;

  // Utility Actions
  reset: () => void;
}

// Initial state
const initialState = {
  // UI State
  sidebarOpen: false,
  theme: 'system' as const,
  notifications: [],
  modals: {},

  // Dashboard State
  selectedDateRange: '30d' as const,
  selectedView: 'overview' as const,
  filters: {},
  sortBy: {
    field: 'date',
    direction: 'desc' as const,
  },

  // Data State
  transactions: [],
  insights: [],
  kpis: null,
  loading: {
    transactions: false,
    insights: false,
    kpis: false,
  },
  error: {
    transactions: null,
    insights: null,
    kpis: null,
  },
};

// Create store
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // UI Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
        addNotification: (notification) => {
          const id = Math.random().toString(36).substr(2, 9);
          const newNotification: Notification = {
            ...notification,
            id,
            createdAt: new Date(),
          };
          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));

          // Auto-remove notification after duration
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        clearNotifications: () => set({ notifications: [] }),
        openModal: (modalId) =>
          set((state) => ({
            modals: { ...state.modals, [modalId]: true },
          })),
        closeModal: (modalId) =>
          set((state) => ({
            modals: { ...state.modals, [modalId]: false },
          })),
        closeAllModals: () => set({ modals: {} }),

        // Dashboard Actions
        setDateRange: (range) => set({ selectedDateRange: range }),
        setView: (view) => set({ selectedView: view }),
        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
          })),
        clearFilters: () => set({ filters: {} }),
        setSortBy: (field, direction) => set({ sortBy: { field, direction } }),

        // Data Actions
        setTransactions: (transactions) => set({ transactions }),
        addTransaction: (transaction) =>
          set((state) => ({
            transactions: [transaction, ...state.transactions],
          })),
        updateTransaction: (id, updates) =>
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          })),
        removeTransaction: (id) =>
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          })),
        setInsights: (insights) => set({ insights }),
        addInsight: (insight) =>
          set((state) => ({
            insights: [insight, ...state.insights],
          })),
        removeInsight: (id) =>
          set((state) => ({
            insights: state.insights.filter((i) => i.id !== id),
          })),
        setKPIs: (kpis) => set({ kpis }),
        setLoading: (key, loading) =>
          set((state) => ({
            loading: { ...state.loading, [key]: loading },
          })),
        setError: (key, error) =>
          set((state) => ({
            error: { ...state.error, [key]: error },
          })),
        clearErrors: () =>
          set({
            error: {
              transactions: null,
              insights: null,
              kpis: null,
            },
          }),

        // Utility Actions
        reset: () => set(initialState),
      }),
      {
        name: 'cashpilot-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          selectedDateRange: state.selectedDateRange,
          selectedView: state.selectedView,
          filters: state.filters,
          sortBy: state.sortBy,
        }),
      }
    ),
    {
      name: 'cashpilot-store',
    }
  )
);

// Selector hooks for better performance
export const useUI = () => {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const theme = useStore((state) => state.theme);
  const notifications = useStore((state) => state.notifications);
  const modals = useStore((state) => state.modals);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);
  const setTheme = useStore((state) => state.setTheme);
  const addNotification = useStore((state) => state.addNotification);
  const removeNotification = useStore((state) => state.removeNotification);
  const clearNotifications = useStore((state) => state.clearNotifications);
  const openModal = useStore((state) => state.openModal);
  const closeModal = useStore((state) => state.closeModal);
  const closeAllModals = useStore((state) => state.closeAllModals);

  return {
    sidebarOpen,
    theme,
    notifications,
    modals,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    addNotification,
    removeNotification,
    clearNotifications,
    openModal,
    closeModal,
    closeAllModals,
  };
};

export const useDashboard = () => {
  const selectedDateRange = useStore((state) => state.selectedDateRange);
  const selectedView = useStore((state) => state.selectedView);
  const filters = useStore((state) => state.filters);
  const sortBy = useStore((state) => state.sortBy);
  const setDateRange = useStore((state) => state.setDateRange);
  const setView = useStore((state) => state.setView);
  const setFilters = useStore((state) => state.setFilters);
  const clearFilters = useStore((state) => state.clearFilters);
  const setSortBy = useStore((state) => state.setSortBy);

  return {
    selectedDateRange,
    selectedView,
    filters,
    sortBy,
    setDateRange,
    setView,
    setFilters,
    clearFilters,
    setSortBy,
  };
};

export const useData = () => {
  const transactions = useStore((state) => state.transactions);
  const insights = useStore((state) => state.insights);
  const kpis = useStore((state) => state.kpis);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const setTransactions = useStore((state) => state.setTransactions);
  const addTransaction = useStore((state) => state.addTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const removeTransaction = useStore((state) => state.removeTransaction);
  const setInsights = useStore((state) => state.setInsights);
  const addInsight = useStore((state) => state.addInsight);
  const removeInsight = useStore((state) => state.removeInsight);
  const setKPIs = useStore((state) => state.setKPIs);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);
  const clearErrors = useStore((state) => state.clearErrors);

  return {
    transactions,
    insights,
    kpis,
    loading,
    error,
    setTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    setInsights,
    addInsight,
    removeInsight,
    setKPIs,
    setLoading,
    setError,
    clearErrors,
  };
};
