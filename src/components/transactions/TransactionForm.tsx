'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import { processTransaction, updateTransaction, ProcessingResult } from '@/lib/transactions/processor';
import { getCategoriesByType, suggestCategories } from '@/lib/transactions/categorizer';
import { Transaction } from '@/types';
import { X, Calendar, DollarSign, FileText, Tag, AlertCircle, CheckCircle } from 'lucide-react';

interface TransactionFormProps {
  transaction?: Transaction; // For editing existing transactions
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function TransactionForm({ 
  transaction, 
  onSave, 
  onCancel, 
  isOpen 
}: TransactionFormProps) {
  const { user } = useAuth();
  const { addNotification } = useData();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'USD',
    description: '',
    category: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    tags: [] as string[],
    attachments: [] as string[]
  });

  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with transaction data if editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date.toISOString().split('T')[0],
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        description: transaction.description,
        category: transaction.category,
        type: transaction.type,
        tags: transaction.tags,
        attachments: transaction.attachments
      });
    }
  }, [transaction]);

  // Update suggested categories when description changes
  useEffect(() => {
    if (formData.description.trim()) {
      const suggestions = suggestCategories(formData.description);
      setSuggestedCategories(suggestions);
      
      // Auto-select first suggestion if no category is selected
      if (!formData.category && suggestions.length > 0) {
        setFormData(prev => ({ ...prev, category: suggestions[0] }));
      }
    } else {
      setSuggestedCategories([]);
    }
  }, [formData.description, formData.category]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setProcessingResult(null); // Clear previous processing results
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const input = {
        userId: user!.uid,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        source: 'manual' as const,
        tags: formData.tags,
        attachments: formData.attachments
      };

      let result: ProcessingResult;

      if (transaction) {
        // Update existing transaction
        result = updateTransaction(transaction, input);
      } else {
        // Create new transaction
        result = processTransaction(input);
      }

      setProcessingResult(result);

      if (result.success) {
        onSave(result.transaction);
        addNotification({
          type: 'success',
          title: transaction ? 'Transaction Updated' : 'Transaction Added',
          message: transaction 
            ? 'Transaction has been updated successfully.'
            : 'Transaction has been added successfully.',
          duration: 3000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: result.errors.join(', '),
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while saving the transaction.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = getCategoriesByType(formData.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="flex space-x-2">
              {(['income', 'expense', 'transfer'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('type', type)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter transaction description"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            
            {/* Suggested Categories */}
            {suggestedCategories.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Suggested categories:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedCategories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleInputChange('category', category)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        formData.category === category
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Processing Results */}
          {processingResult && (
            <div className={`p-3 rounded-lg border ${
              processingResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start">
                {processingResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                )}
                <div className="flex-1">
                  {processingResult.errors.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-red-800">Errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {processingResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {processingResult.warnings.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside">
                        {processingResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (transaction ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
