'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { calculateKPIs, convertToKPIs } from '@/lib/calculations';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RealtimeKPICard from '@/components/dashboard/RealtimeKPICard';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import RealtimeTransactionList from '@/components/dashboard/RealtimeTransactionList';
import RealtimeInsightsCard from '@/components/dashboard/RealtimeInsightsCard';
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
    transactions, 
    insights, 
    loading, 
    error 
  } = useRealtimeData();

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
          <RealtimeKPICard
            title="Accounts Receivable"
            value="accountsReceivable"
            tooltip="Money coming in - total amount your customers owe you. This is money you've earned but haven't received yet. Higher is better for cash flow."
          />
          <RealtimeKPICard
            title="Accounts Payable"
            value="accountsPayable"
            tooltip="Money going out - total amount you owe to suppliers and vendors. Lower is better for cash flow. This includes bills, loans, and expenses."
          />
          <RealtimeKPICard
            title="Net Cash Flow"
            value="netCashFlow"
            tooltip="Money coming in minus money going out. Positive means you're making more than you're spending. This is your profit after expenses."
          />
          <RealtimeKPICard
            title="Cash Runway"
            value="cashRunway"
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
              <CashFlowChart data={transactions || []} loading={loading} />
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-1">
            <RealtimeInsightsCard />
          </div>
        </div>

        {/* Recent Transactions */}
        <RealtimeTransactionList />
      </div>
    </DashboardLayout>
  );
}
