'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useOptimisticTransactions } from '@/hooks/useOptimisticUpdates';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Tag,
  Clock,
  Plus,
  Minus
} from 'lucide-react';

interface RealtimeTransactionListProps {
  limit?: number;
  showNewIndicator?: boolean;
  className?: string;
}

export default function RealtimeTransactionList({ 
  limit = 10, 
  showNewIndicator = true,
  className = '' 
}: RealtimeTransactionListProps) {
  const { transactions } = useRealtimeData();
  const { applyOptimisticUpdates } = useOptimisticTransactions();
  const [newTransactions, setNewTransactions] = useState<Set<string>>(new Set());
  const [previousTransactionCount, setPreviousTransactionCount] = useState(0);

  // Apply optimistic updates
  const displayTransactions = applyOptimisticUpdates(transactions).slice(0, limit);

  // Track new transactions
  useEffect(() => {
    if (transactions.length > previousTransactionCount && showNewIndicator) {
      const newIds = transactions
        .slice(0, transactions.length - previousTransactionCount)
        .map(t => t.id);
      
      setNewTransactions(prev => new Set([...prev, ...newIds]));
      
      // Remove new indicator after 5 seconds
      setTimeout(() => {
        setNewTransactions(prev => {
          const updated = new Set(prev);
          newIds.forEach(id => updated.delete(id));
          return updated;
        });
      }, 5000);
    }
    setPreviousTransactionCount(transactions.length);
  }, [transactions.length, previousTransactionCount, showNewIndicator]);

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));

    return (
      <span className={`font-medium ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
        {type === 'income' ? '+' : '-'}{formatted}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? (
      <Plus className="h-4 w-4 text-green-500" />
    ) : (
      <Minus className="h-4 w-4 text-red-500" />
    );
  };

  if (displayTransactions.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No transactions yet</p>
          <p className="text-sm">Transactions will appear here in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
              newTransactions.has(transaction.id)
                ? 'border-green-200 bg-green-50 animate-pulse'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {getTransactionIcon(transaction.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  {newTransactions.has(transaction.id) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span>{transaction.category}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              {formatAmount(transaction.amount, transaction.type)}
              <div className="text-xs text-gray-500 mt-1">
                {transaction.source}
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length > limit && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all {transactions.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}
