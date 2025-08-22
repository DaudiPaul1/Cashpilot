'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import { Plus, Download, Filter, Search } from 'lucide-react';

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
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load transactions
  useEffect(() => {
    if (!user?.uid) return;

    const loadTransactions = async () => {
      try {
        setLoading('transactions', true);
        setError('transactions', null);

        // For MVP, we'll use mock data
        // In production, this would fetch from Firestore
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
            amount: 12000,
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
            amount: 800,
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

    loadTransactions();
  }, [user?.uid, setTransactions, setLoading, setError]);

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          transaction.description.toLowerCase().includes(query) ||
          transaction.category.toLowerCase().includes(query) ||
          transaction.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type && transaction.type !== filters.type) return false;

      // Category filter
      if (filters.category && transaction.category !== filters.category) return false;

      // Date range filter
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (transaction.date < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        if (transaction.date > toDate) return false;
      }

      // Amount range filter
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (transaction.amount < minAmount) return false;
      }
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (transaction.amount > maxAmount) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = a.date.getTime() - b.date.getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleAddTransaction = (transaction: any) => {
    // In production, this would save to Firestore
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      userId: user?.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTransactions([newTransaction, ...transactions]);
    setShowAddModal(false);
  };

  const handleDeleteTransaction = (id: string) => {
    // In production, this would delete from Firestore
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleUpdateTransaction = (id: string, updates: any) => {
    // In production, this would update in Firestore
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
    ));
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Status', 'Tags'].join(','),
      ...filteredTransactions.map(t => [
        t.date.toISOString().split('T')[0],
        `"${t.description}"`,
        t.category,
        t.type,
        t.amount,
        t.status,
        `"${t.tags.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">Manage your income and expenses</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportTransactions}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="description">Sort by Description</option>
                <option value="category">Sort by Category</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <TransactionFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm">
          <TransactionList
            transactions={filteredTransactions}
            loading={loading.transactions}
            error={error.transactions}
            onDelete={handleDeleteTransaction}
            onUpdate={handleUpdateTransaction}
          />
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <AddTransactionModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddTransaction}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
