'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import { validateQuickBooksCredentials, syncQuickBooksData, QuickBooksClient } from '@/lib/integrations/quickbooks';
import { 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Settings,
  RefreshCw,
  Building
} from 'lucide-react';

interface QuickBooksConnectProps {
  onSuccess?: (companyInfo: any) => void;
  onClose?: () => void;
}

export default function QuickBooksConnect({ onSuccess, onClose }: QuickBooksConnectProps) {
  const { user } = useAuth();
  const { addNotification, bulkAddTransactions } = useData();
  
  const [formData, setFormData] = useState({
    realmId: '',
    accessToken: ''
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    companyInfo?: any;
    error?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    count?: number;
    error?: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationResult(null);
    setSyncResult(null);
  };

  const validateCredentials = async () => {
    if (!formData.realmId || !formData.accessToken) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both Realm ID and Access Token.'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateQuickBooksCredentials(formData.realmId, formData.accessToken);
      setValidationResult(result);

      if (result.isValid) {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: `Successfully connected to ${result.companyInfo?.CompanyName || 'your QuickBooks company'}.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: result.error || 'Invalid credentials. Please check your Realm ID and Access Token.'
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'Failed to validate credentials'
      });
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Failed to validate QuickBooks credentials. Please try again.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const syncData = async () => {
    if (!validationResult?.isValid) {
      addNotification({
        type: 'error',
        title: 'Not Connected',
        message: 'Please validate your QuickBooks connection first.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const client = new QuickBooksClient(formData.realmId, formData.accessToken);
      const transactions = await syncQuickBooksData(client, user!.uid);
      
      // Add transactions to store
      bulkAddTransactions(transactions);
      
      setSyncResult({
        success: true,
        count: transactions.length
      });

      addNotification({
        type: 'success',
        title: 'Data Synced',
        message: `Successfully imported ${transactions.length} transactions from QuickBooks.`
      });

      // Call success callback
      if (onSuccess && validationResult.companyInfo) {
        onSuccess(validationResult.companyInfo);
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync data'
      });
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync data from QuickBooks. Please try again.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getQuickBooksHelpUrl = () => {
    return 'https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calculator className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Connect QuickBooks</h3>
            <p className="text-sm text-gray-500">Import your accounting data</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Realm ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Realm ID
          </label>
          <input
            type="text"
            value={formData.realmId}
            onChange={(e) => handleInputChange('realmId', e.target.value)}
            placeholder="1234567890123456789"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Found in your QuickBooks app settings
          </p>
        </div>

        {/* Access Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Token
          </label>
          <input
            type="password"
            value={formData.accessToken}
            onChange={(e) => handleInputChange('accessToken', e.target.value)}
            placeholder="eyJraWQiOiJ..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            OAuth 2.0 access token from QuickBooks API
          </p>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <a
            href={getQuickBooksHelpUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-1" />
            How to get QuickBooks credentials
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-3 rounded-lg border ${
            validationResult.isValid 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? 'Connection Valid' : 'Connection Failed'}
                </p>
                {validationResult.companyInfo && (
                  <div className="text-xs text-green-600">
                    <p>Connected to: {validationResult.companyInfo.CompanyName}</p>
                    <p>Legal Name: {validationResult.companyInfo.LegalName}</p>
                  </div>
                )}
                {validationResult.error && (
                  <p className="text-xs text-red-600">{validationResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className={`p-3 rounded-lg border ${
            syncResult.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center">
              {syncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  syncResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                </p>
                {syncResult.count !== undefined && (
                  <p className="text-xs text-green-600">
                    Imported {syncResult.count} transactions
                  </p>
                )}
                {syncResult.error && (
                  <p className="text-xs text-red-600">{syncResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={validateCredentials}
            disabled={isValidating || !formData.realmId || !formData.accessToken}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isValidating ? 'Validating...' : 'Validate'}
          </button>

          <button
            onClick={syncData}
            disabled={isSyncing || !validationResult?.isValid}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {/* QuickBooks Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <Building className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">QuickBooks Integration</p>
              <p>This will sync invoices, bills, customers, and vendors from your QuickBooks account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
