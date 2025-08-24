'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import { Transaction } from '@/types';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download,
  X,
  Info
} from 'lucide-react';

interface BulkImportProps {
  onClose?: () => void;
}

interface CSVRow {
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
}

export default function BulkImport({ onClose }: BulkImportProps) {
  const { user } = useAuth();
  const { addNotification, bulkAddTransactions } = useData();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      addNotification({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select a CSV file.'
      });
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setErrors([]);
    setPreviewData([]);

    try {
      const csvData = await parseCSV(file);
      const validatedData = validateCSVData(csvData);
      
      setPreviewData(validatedData.validRows);
      setErrors(validatedData.errors);
      
      if (validatedData.validRows.length > 0) {
        addNotification({
          type: 'success',
          title: 'File Uploaded',
          message: `Successfully parsed ${validatedData.validRows.length} transactions.`
        });
      }
      
      if (validatedData.errors.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Validation Warnings',
          message: `Found ${validatedData.errors.length} issues in your CSV file.`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'File Processing Error',
        message: 'Failed to process the CSV file. Please check the format.'
      });
      setErrors(['Failed to parse CSV file']);
    } finally {
      setIsUploading(false);
    }
  };

  const parseCSV = async (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Validate headers
          const requiredHeaders = ['date', 'amount', 'description', 'category', 'type'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }
          
          const data: CSVRow[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim());
            if (values.length < 5) continue;
            
            const row: CSVRow = {
              date: values[headers.indexOf('date')],
              amount: parseFloat(values[headers.indexOf('amount')]) || 0,
              description: values[headers.indexOf('description')],
              category: values[headers.indexOf('category')],
              type: values[headers.indexOf('type')] as 'income' | 'expense' | 'transfer'
            };
            
            data.push(row);
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const validateCSVData = (data: CSVRow[]): { validRows: CSVRow[]; errors: string[] } => {
    const validRows: CSVRow[] = [];
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of 0-based index and header row
      
      // Validate date
      if (!row.date || isNaN(Date.parse(row.date))) {
        errors.push(`Row ${rowNumber}: Invalid date format`);
        return;
      }
      
      // Validate amount
      if (isNaN(row.amount) || row.amount === 0) {
        errors.push(`Row ${rowNumber}: Invalid amount`);
        return;
      }
      
      // Validate description
      if (!row.description || row.description.trim().length === 0) {
        errors.push(`Row ${rowNumber}: Missing description`);
        return;
      }
      
      // Validate category
      if (!row.category || row.category.trim().length === 0) {
        errors.push(`Row ${rowNumber}: Missing category`);
        return;
      }
      
      // Validate type
      if (!['income', 'expense', 'transfer'].includes(row.type)) {
        errors.push(`Row ${rowNumber}: Invalid type (must be income, expense, or transfer)`);
        return;
      }
      
      validRows.push(row);
    });
    
    return { validRows, errors };
  };

  const importTransactions = async () => {
    if (previewData.length === 0) {
      addNotification({
        type: 'error',
        title: 'No Data to Import',
        message: 'Please upload a valid CSV file first.'
      });
      return;
    }

    setIsProcessing(true);
    let success = 0;
    let errors = 0;

    try {
      const transactions: Transaction[] = previewData.map((row, index) => ({
        id: `bulk_import_${Date.now()}_${index}`,
        userId: user!.uid,
        date: new Date(row.date),
        amount: row.type === 'expense' ? -Math.abs(row.amount) : Math.abs(row.amount),
        currency: 'USD',
        description: row.description,
        category: row.category,
        type: row.type,
        source: 'manual',
        sourceId: `bulk_import_${Date.now()}`,
        status: 'completed' as const,
        tags: ['bulk-import', 'csv'],
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Add transactions to store
      bulkAddTransactions(transactions);
      
      success = transactions.length;
      setSuccessCount(success);
      setErrorCount(errors);

      addNotification({
        type: 'success',
        title: 'Import Successful',
        message: `Successfully imported ${success} transactions.`
      });

      // Reset form
      setUploadedFile(null);
      setPreviewData([]);
      setErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to import transactions. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `date,amount,description,category,type
2024-01-15,1500.00,Client Payment - Project A,Client Services,income
2024-01-16,-250.00,Office Supplies,Office Supplies,expense
2024-01-17,500.00,Consulting Fee,Client Services,income
2024-01-18,-75.50,Software Subscription,Software & Subscriptions,expense
2024-01-19,2000.00,Product Sale,Product Sales,income`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bulk Import Transactions</h3>
            <p className="text-sm text-gray-500">Import multiple transactions from a CSV file</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload CSV File
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  CSV, max 10MB
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="csv-upload"
                name="csv-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        {/* Template Download */}
        <div className="text-center">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-1" />
            Download CSV Template
          </button>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Processing CSV file...</span>
          </div>
        )}

        {/* Preview Data */}
        {previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">
                Preview ({previewData.length} transactions)
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {successCount > 0 && `${successCount} imported`}
                </span>
                {errorCount > 0 && (
                  <span className="text-sm text-red-500">
                    {errorCount} errors
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                        row.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${Math.abs(row.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-xs">
                        {row.description}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.category}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          row.type === 'income' ? 'bg-green-100 text-green-800' :
                          row.type === 'expense' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 10 of {previewData.length} transactions
                </p>
              )}
            </div>

            {/* Import Button */}
            <div className="flex justify-end">
              <button
                onClick={importTransactions}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isProcessing ? 'Importing...' : `Import ${previewData.length} Transactions`}
              </button>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Validation Errors ({errors.length})
                </h4>
                <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-1">CSV Format Requirements</h4>
              <ul className="space-y-1">
                <li>• Required columns: date, amount, description, category, type</li>
                <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                <li>• Amount: Positive numbers (negative for expenses)</li>
                <li>• Type: income, expense, or transfer</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
