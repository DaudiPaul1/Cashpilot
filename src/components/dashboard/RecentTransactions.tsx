'use client';

import { Transaction } from '@/types';
import { format } from 'date-fns';
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: string | null;
}

export default function RecentTransactions({ 
  transactions, 
  loading = false, 
  error = null 
}: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'income') {
      return (
        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
          <ArrowUpRight className="h-5 w-5 text-green-600" />
        </div>
      );
    } else {
      return (
        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
          <ArrowDownLeft className="h-5 w-5 text-red-600" />
        </div>
      );
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading transactions</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p className="text-gray-500">Add your first transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.slice(0, 5).map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {getTransactionIcon(transaction.type)}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {transaction.description}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {format(transaction.date, 'MMM dd, yyyy')}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {transaction.category}
              </span>
              {transaction.tags.length > 0 && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {transaction.tags[0]}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount))}
            </p>
            <p className="text-xs text-gray-500">
              {transaction.status}
            </p>
          </div>
        </div>
      ))}
      
      {transactions.length > 5 && (
        <div className="text-center pt-4">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all {transactions.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}
