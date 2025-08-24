'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import ShopifyConnect from '@/components/integrations/ShopifyConnect';
import QuickBooksConnect from '@/components/integrations/QuickBooksConnect';
import { 
  ShoppingBag, 
  Calculator, 
  FileText, 
  CheckCircle,
  ArrowRight,
  X
} from 'lucide-react';

interface IntegrationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'available' | 'coming-soon' | 'connected';
}

const integrationOptions: IntegrationOption[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect your e-commerce store to automatically import orders, revenue, and customer data.',
    icon: ShoppingBag,
    color: 'green',
    status: 'available'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync your accounting data for comprehensive expense tracking and financial reporting.',
    icon: Calculator,
    color: 'blue',
    status: 'available'
  },
  {
    id: 'manual',
    name: 'Manual Entry',
    description: 'Enter transactions manually or import via CSV for complete control over your data.',
    icon: FileText,
    color: 'gray',
    status: 'available'
  }
];

interface IntegrationSelectorProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function IntegrationSelector({ onComplete, onSkip }: IntegrationSelectorProps) {
  const { user } = useAuth();
  const { addNotification } = useData();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showShopifyConnect, setShowShopifyConnect] = useState(false);
  const [showQuickBooksConnect, setShowQuickBooksConnect] = useState(false);
  const [completedIntegrations, setCompletedIntegrations] = useState<string[]>([]);

  const handleIntegrationSelect = (integrationId: string) => {
    setSelectedIntegration(integrationId);
    
    if (integrationId === 'shopify') {
      setShowShopifyConnect(true);
    } else if (integrationId === 'quickbooks') {
      setShowQuickBooksConnect(true);
    } else if (integrationId === 'manual') {
      // For manual entry, we can skip the setup and go directly to the dashboard
      setCompletedIntegrations(prev => [...prev, 'manual']);
      addNotification({
        type: 'success',
        title: 'Manual Entry Selected',
        message: 'You can start entering transactions manually. You can always connect integrations later.'
      });
      if (onComplete) onComplete();
    }
  };

  const handleShopifySuccess = (shopInfo: any) => {
    setCompletedIntegrations(prev => [...prev, 'shopify']);
    setShowShopifyConnect(false);
    setSelectedIntegration(null);
    
    addNotification({
      type: 'success',
      title: 'Shopify Connected',
      message: `Successfully connected to ${shopInfo.name}. Your data is now syncing.`
    });
    
    if (onComplete) onComplete();
  };

  const handleShopifyClose = () => {
    setShowShopifyConnect(false);
    setSelectedIntegration(null);
  };

  const handleQuickBooksSuccess = (companyInfo: any) => {
    setCompletedIntegrations(prev => [...prev, 'quickbooks']);
    setShowQuickBooksConnect(false);
    setSelectedIntegration(null);
    
    addNotification({
      type: 'success',
      title: 'QuickBooks Connected',
      message: `Successfully connected to ${companyInfo.CompanyName}. Your accounting data is now syncing.`
    });
    
    if (onComplete) onComplete();
  };

  const handleQuickBooksClose = () => {
    setShowQuickBooksConnect(false);
    setSelectedIntegration(null);
  };

  const getStatusBadge = (status: IntegrationOption['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        );
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Coming Soon
          </span>
        );
      case 'connected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Connected
          </span>
        );
    }
  };

  if (showShopifyConnect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="relative">
          <button
            onClick={handleShopifyClose}
            className="absolute -top-2 -right-2 h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
          <ShopifyConnect onSuccess={handleShopifySuccess} onClose={handleShopifyClose} />
        </div>
      </div>
    );
  }

  if (showQuickBooksConnect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="relative">
          <button
            onClick={handleQuickBooksClose}
            className="absolute -top-2 -right-2 h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
          <QuickBooksConnect onSuccess={handleQuickBooksSuccess} onClose={handleQuickBooksClose} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Connect Your Data Sources
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose how you want to import your financial data. You can connect multiple sources or start with manual entry.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {integrationOptions.map((option) => {
          const Icon = option.icon;
          const isCompleted = completedIntegrations.includes(option.id);
          const isSelected = selectedIntegration === option.id;
          
          return (
            <div
              key={option.id}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : isCompleted
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => handleIntegrationSelect(option.id)}
            >
              {isCompleted && (
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className="flex items-center mb-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center mr-4 ${
                  option.color === 'green' ? 'bg-green-100' :
                  option.color === 'blue' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    option.color === 'green' ? 'text-green-600' :
                    option.color === 'blue' ? 'text-blue-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{option.name}</h3>
                  {getStatusBadge(option.status)}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{option.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {option.status === 'coming-soon' ? 'Available soon' : 'Ready to connect'}
                </span>
                {!isCompleted && option.status === 'available' && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <div className="flex justify-center space-x-4">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
          )}
          
          {completedIntegrations.length > 0 && (
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          You can always add or change integrations later in your settings.
        </p>
      </div>
    </div>
  );
}
