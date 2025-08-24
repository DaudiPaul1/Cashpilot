'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubscriptionPlans from '@/components/billing/SubscriptionPlans';
import BillingPortal from '@/components/billing/BillingPortal';
import { Customer } from '@/lib/stripe/client';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const { addNotification } = useData();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans');

  useEffect(() => {
    if (user?.uid) {
      loadCustomerData();
    }
  }, [user?.uid]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/stripe?action=customer', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        const { customer } = await response.json();
        setCustomer(customer);
      } else if (response.status === 404) {
        // Customer doesn't exist yet, that's okay
        setCustomer(null);
      } else {
        throw new Error('Failed to load customer data');
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load billing information.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Check for success/canceled parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      addNotification({
        type: 'success',
        title: 'Payment Successful',
        message: 'Your subscription has been activated successfully!'
      });
      // Reload customer data
      loadCustomerData();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      addNotification({
        type: 'info',
        title: 'Payment Canceled',
        message: 'Your payment was canceled. You can try again anytime.'
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const currentPlan = customer?.subscription?.plan || 'FREE';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your subscription and billing information.</p>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-500">
              Current Plan: <span className="font-medium text-gray-900">{currentPlan}</span>
            </span>
          </div>
        </div>

        {/* Current Plan Status */}
        {customer?.subscription && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Subscription</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Plan: {customer.subscription.plan}</span>
                  <span>•</span>
                  <span>Status: {customer.subscription.status}</span>
                  <span>•</span>
                  <span>Next billing: {customer.subscription.currentPeriodEnd.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center">
                {customer.subscription.status === 'active' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : customer.subscription.status === 'past_due' ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Billing & Invoices
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'plans' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">
                Select the plan that best fits your business needs. You can upgrade or downgrade at any time.
              </p>
            </div>
            <SubscriptionPlans currentPlan={currentPlan} />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Billing Management</h2>
              <p className="text-gray-600">
                Manage your payment methods, view billing history, and update your subscription.
              </p>
            </div>
            <BillingPortal customer={customer} />
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-1">Need Help?</h4>
              <p>
                If you have any questions about billing or need to make changes to your subscription, 
                please contact our support team. We're here to help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
