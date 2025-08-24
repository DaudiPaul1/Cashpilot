'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import KPICard from '@/components/dashboard/KPICard';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Calendar,
  RefreshCw,
  Users,
  ShoppingCart
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { 
    kpis, 
    transactions, 
    insights, 
    loading, 
    error,
    setKPIs, 
    setTransactions, 
    setInsights,
    setLoading,
    setError 
  } = useData();

  // Load dashboard data
  useEffect(() => {
    if (!user?.uid) return;

    const loadDashboardData = async () => {
      try {
        setLoading('kpis', true);
        setLoading('transactions', true);
        setLoading('insights', true);
        setError('kpis', null);
        setError('transactions', null);
        setError('insights', null);

        // For MVP, we'll use mock data
        // In production, this would fetch from Firestore
        const mockKPIs = {
          accountsReceivable: 125000,
          accountsPayable: 85000,
          netCashFlow: 40000,
          cashRunway: 45,
          monthlyRecurringRevenue: 95000,
          customerLifetimeValue: 2500,
          churnRate: 0.05,
          lastUpdated: new Date()
        };

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

        const mockInsights = [
          {
            id: '1',
            userId: user.uid,
            type: 'health_score' as const,
            title: 'Strong Financial Health',
            content: 'Your cash flow is positive and you have a healthy runway. Consider investing in growth opportunities.',
            score: 85,
            priority: 'low' as const,
            actionable: true,
            actionItems: [
              {
                id: '1',
                title: 'Review investment opportunities',
                description: 'Consider allocating some cash to growth initiatives',
                completed: false
              }
            ],
            metadata: {
              cashFlow: 40000,
              runway: 45
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setKPIs(mockKPIs);
        setTransactions(mockTransactions);
        setInsights(mockInsights);
      } catch (err) {
        setError('kpis', 'Failed to load KPIs');
        setError('transactions', 'Failed to load transactions');
        setError('insights', 'Failed to load insights');
      } finally {
        setLoading('kpis', false);
        setLoading('transactions', false);
        setLoading('insights', false);
      }
    };

    loadDashboardData();
  }, [user?.uid, setKPIs, setTransactions, setInsights, setLoading, setError]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Overview</h1>
            <p className="text-gray-600">Your key business metrics at a glance</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Accounts Receivable"
            value={kpis ? formatCurrency(kpis.accountsReceivable) : '$0'}
            change={12.5}
            changeType="positive"
            icon={<DollarSign className="h-6 w-6 text-green-600" />}
            format="currency"
            loading={loading.kpis}
            tooltip="Money coming in - total amount your customers owe you. This is money you've earned but haven't received yet. Higher is better for cash flow."
          />
          <KPICard
            title="Accounts Payable"
            value={kpis ? formatCurrency(kpis.accountsPayable) : '$0'}
            change={-8.2}
            changeType="negative"
            icon={<CreditCard className="h-6 w-6 text-red-600" />}
            format="currency"
            loading={loading.kpis}
            tooltip="Money going out - total amount you owe to suppliers and vendors. Lower is better for cash flow. This includes bills, loans, and expenses."
          />
          <KPICard
            title="Net Cash Flow"
            value={kpis ? formatCurrency(kpis.netCashFlow) : '$0'}
            change={kpis ? (kpis.netCashFlow > 0 ? 15.3 : -5.7) : 0}
            changeType={kpis ? (kpis.netCashFlow > 0 ? 'positive' : 'negative') : 'neutral'}
            icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
            format="currency"
            loading={loading.kpis}
            tooltip="Money coming in minus money going out. Positive means you're making more than you're spending. This is your profit after expenses."
          />
          <KPICard
            title="Cash Runway"
            value={kpis ? `${kpis.cashRunway} days` : '0 days'}
            change={5.2}
            changeType="positive"
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            format="text"
            loading={loading.kpis}
            tooltip="How long your business can survive if no money comes in. More days = safer. Aim for at least 3-6 months of runway."
          />
        </div>

        {/* Quick Stats for Small Business */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(125000)}</p>
                <p className="text-sm text-green-600">+8.5% vs last month</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-xl font-bold text-gray-900">24</p>
                <p className="text-sm text-green-600">+2 new this month</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-xl font-bold text-gray-900">32%</p>
                <p className="text-sm text-green-600">+2.1% vs last month</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Cash Flow Trend</h2>
                <div className="flex items-center space-x-4">
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last 12 months</option>
                  </select>
                </div>
              </div>
              <CashFlowChart data={transactions} loading={loading.transactions} />
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-1">
            <AIInsightsCard 
              insights={insights} 
              loading={loading.insights}
              error={error.insights}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
          <RecentTransactions 
            transactions={transactions} 
            loading={loading.transactions}
            error={error.transactions}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
