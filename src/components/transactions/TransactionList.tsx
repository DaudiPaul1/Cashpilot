'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Tag,
  FileText
} from 'lucide-react';
import { useUI } from '@/store/useStore';

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
}

export default function TransactionList({
  transactions,
  loading = false,
  error = null,
  onDelete,
  onUpdate
}: TransactionListProps) {
  const { addNotification } = useUI();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setShowDeleteConfirm(null);
    addNotification({
      type: 'success',
      title: 'Transaction deleted',
      message: 'The transaction has been successfully deleted.',
      duration: 3000,
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading transactions</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-4">Transaction</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Transaction Rows */}
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Transaction Info */}
              <div className="col-span-4">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {transaction.source}
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
                </div>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">{transaction.category}</span>
              </div>

              {/* Date */}
              <div className="col-span-2">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {format(transaction.date, 'MMM dd, yyyy')}
                </div>
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <span className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteConfirm(transaction.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Actions Dropdown */}
                  {showDeleteConfirm === transaction.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleView(transaction)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {transactions.length} transactions</span>
          <div className="flex items-center space-x-4">
            <span>
              Total Income: <span className="font-medium text-green-600">
                {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </span>
            <span>
              Total Expenses: <span className="font-medium text-red-600">
                {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
