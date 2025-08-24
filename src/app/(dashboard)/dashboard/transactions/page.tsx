'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tooltip } from '@/components/ui/Tooltip';
import { 
  Search, 
  Filter, 
  Download, 
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw
} from 'lucide-react';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { 
    transactions, 
    loading, 
    error,
    setTransactions, 
    setLoading,
    setError 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Load transactions data
  useEffect(() => {
    if (!user?.uid) return;

    const loadTransactionsData = async () => {
      try {
        setLoading('transactions', true);
        setError('transactions', null);

        // Mock transactions data
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
          },
          {
            id: '4',
            userId: user.uid,
            date: new Date('2024-01-12'),
            amount: 8000,
            currency: 'USD',
            description: 'Consulting Services',
            category: 'Income',
            type: 'income' as const,
            source: 'manual' as const,
            status: 'completed' as const,
            tags: ['consulting', 'services'],
            attachments: [],
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-12')
          },
          {
            id: '5',
            userId: user.uid,
            date: new Date('2024-01-11'),
            amount: 1200,
            currency: 'USD',
            description: 'Marketing Campaign',
            category: 'Marketing',
            type: 'expense' as const,
            source: 'manual' as const,
            status: 'completed' as const,
            tags: ['marketing', 'campaign'],
            attachments: [],
            createdAt: new Date('2024-01-11'),
            updatedAt: new Date('2024-01-11')
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setTransactions(mockTransactions);
      } catch (err) {
        setError('transactions', 'Failed to load transactions');
      } finally {
        setLoading('transactions', false);
      }
    };

    loadTransactionsData();
  }, [user?.uid, setTransactions, setLoading, setError]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Calculate summary metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">Track all your business income and expenses in one place.</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Tooltip content="Money coming in - total money your business earned this month from all sources.">
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
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
                <div className="flex items-center mb-2">
                  <Tooltip content="Money going out - total money your business spent on operations and expenses.">
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  +8.2% vs last month
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Tooltip content="Money left after paying all expenses. This is your profit.">
                    <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                  </Tooltip>
                </div>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(netCashFlow)}
                </p>
                <p className={`text-sm flex items-center mt-1 ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {netCashFlow >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +15.3% vs last month
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-1" />
                      -5.7% vs last month
                    </>
                  )}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                netCashFlow >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`h-6 w-6 ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Income">Income</option>
                <option value="Expenses">Expenses</option>
                <option value="Technology">Technology</option>
                <option value="Marketing">Marketing</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          
          {loading.transactions ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error.transactions ? (
            <div className="p-6">
              <p className="text-red-600">Error loading transactions: {error.transactions}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No transactions found matching your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <DollarSign className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{transaction.category}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
