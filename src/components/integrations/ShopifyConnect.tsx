'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import { validateShopifyCredentials, syncShopifyData, ShopifyClient } from '@/lib/integrations/shopify';
import { 
  ShoppingBag, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Settings,
  RefreshCw
} from 'lucide-react';

interface ShopifyConnectProps {
  onSuccess?: (shopInfo: any) => void;
  onClose?: () => void;
}

export default function ShopifyConnect({ onSuccess, onClose }: ShopifyConnectProps) {
  const { user } = useAuth();
  const { addNotification, bulkAddTransactions } = useData();
  
  const [formData, setFormData] = useState({
    shopDomain: '',
    accessToken: ''
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    shopInfo?: any;
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
    if (!formData.shopDomain || !formData.accessToken) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both shop domain and access token.'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateShopifyCredentials(formData.shopDomain, formData.accessToken);
      setValidationResult(result);

      if (result.isValid) {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: `Successfully connected to ${result.shopInfo?.name || 'your Shopify store'}.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: result.error || 'Invalid credentials. Please check your shop domain and access token.'
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
        message: 'Failed to validate Shopify credentials. Please try again.'
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
        message: 'Please validate your Shopify connection first.'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const client = new ShopifyClient(formData.shopDomain, formData.accessToken);
      const transactions = await syncShopifyData(client, user!.uid);
      
      // Add transactions to store
      bulkAddTransactions(transactions);
      
      setSyncResult({
        success: true,
        count: transactions.length
      });

      addNotification({
        type: 'success',
        title: 'Data Synced',
        message: `Successfully imported ${transactions.length} transactions from Shopify.`
      });

      // Call success callback
      if (onSuccess && validationResult.shopInfo) {
        onSuccess(validationResult.shopInfo);
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync data'
      });
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync data from Shopify. Please try again.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getShopifyHelpUrl = () => {
    const shopDomain = formData.shopDomain || 'your-shop';
    return `https://${shopDomain}.myshopify.com/admin/apps/private`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Connect Shopify</h3>
            <p className="text-sm text-gray-500">Import your e-commerce data</p>
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
        {/* Shop Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop Domain
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              https://
            </span>
            <input
              type="text"
              value={formData.shopDomain}
              onChange={(e) => handleInputChange('shopDomain', e.target.value)}
              placeholder="your-shop.myshopify.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
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
            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your Shopify admin under Apps > Private apps
          </p>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <a
            href={getShopifyHelpUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-1" />
            How to get access token
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
                {validationResult.shopInfo && (
                  <p className="text-xs text-green-600">
                    Connected to: {validationResult.shopInfo.name}
                  </p>
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
            disabled={isValidating || !formData.shopDomain || !formData.accessToken}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
