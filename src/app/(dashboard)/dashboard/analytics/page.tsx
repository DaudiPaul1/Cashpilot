'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { 
    transactions, 
    loading, 
    error,
    setTransactions, 
    setLoading,
    setError 
  } = useData();

  // Load analytics data
  useEffect(() => {
    if (!user?.uid) return;

    const loadAnalyticsData = async () => {
      try {
        setLoading('transactions', true);
        setError('transactions', null);

        // Mock analytics data
        const mockTransactions = [
          {
            id: '1',
            userId: user.uid,
            date: new Date('2024-01-15'),
            amount: 25000,
            currency: 'USD',
            description: 'Client Payment - Project Alpha',
            category: 'Income',
            type: 'income' as const,
            source: 'manual' as const,
            status: 'completed' as const,
            tags: ['client', 'project'],
            attachments: [],
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
          },
          {
            id: '2',
            userId: user.uid,
            date: new Date('2024-01-14'),
            amount: 1500,
            currency: 'USD',
            description: 'Office Supplies',
            category: 'Expenses',
            type: 'expense' as const,
            source: 'manual' as const,
            status: 'completed' as const,
            tags: ['office', 'supplies'],
            attachments: [],
            createdAt: new Date('2024-01-14'),
            updatedAt: new Date('2024-01-14')
          },
          {
            id: '3',
            userId: user.uid,
            date: new Date('2024-01-13'),
            amount: 5000,
            currency: 'USD',
            description: 'Software Subscription',
            category: 'Technology',
            type: 'expense' as const,
            source: 'manual' as const,
            status: 'completed' as const,
            tags: ['software', 'subscription'],
            attachments: [],
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-13')
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setTransactions(mockTransactions);
      } catch (err) {
        setError('transactions', 'Failed to load analytics data');
      } finally {
        setLoading('transactions', false);
      }
    };

    loadAnalyticsData();
  }, [user?.uid, setTransactions, setLoading, setError]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Deep dive into your financial performance and trends.</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(125000)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5% vs last month
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(85000)}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  +8.2% vs last month
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(40000)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +15.3% vs last month
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(2500)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +5.2% vs last month
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h2>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 12 months</option>
              </select>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - Revenue vs Expenses</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Expense Categories</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View details
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Technology</span>
                </div>
                <span className="text-sm font-medium text-gray-900">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Office</span>
                </div>
                <span className="text-sm font-medium text-gray-900">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Marketing</span>
                </div>
                <span className="text-sm font-medium text-gray-900">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Other</span>
                </div>
                <span className="text-sm font-medium text-gray-900">20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">85%</p>
              <p className="text-sm text-gray-600">Profit Margin</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">12.5</p>
              <p className="text-sm text-gray-600">Avg. Days to Payment</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">45</p>
              <p className="text-sm text-gray-600">Cash Runway (Days)</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
