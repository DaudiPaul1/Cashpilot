'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import { Customer, Invoice, PaymentMethod } from '@/lib/stripe/client';
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  DollarSign,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface BillingPortalProps {
  customer?: Customer;
}

export default function BillingPortal({ customer }: BillingPortalProps) {
  const { user } = useAuth();
  const { addNotification } = useData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      loadBillingData();
    }
  }, [customer]);

  const loadBillingData = async () => {
    if (!customer) return;

    try {
      setLoading(true);

      // Load invoices
      const invoicesResponse = await fetch('/api/stripe?action=invoices', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (invoicesResponse.ok) {
        const { invoices } = await invoicesResponse.json();
        setInvoices(invoices);
      }

      // Load payment methods
      const paymentMethodsResponse = await fetch('/api/stripe?action=payment_methods', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (paymentMethodsResponse.ok) {
        const { paymentMethods } = await paymentMethodsResponse.json();
        setPaymentMethods(paymentMethods);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load billing information.'
      });
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      setPortalLoading(true);

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          action: 'create_billing_portal',
          returnUrl: `${window.location.origin}/dashboard/billing`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { session } = await response.json();
      window.location.href = session.url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to open billing portal. Please try again.'
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <X className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'open':
        return 'text-yellow-600 bg-yellow-100';
      case 'past_due':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100); // Stripe amounts are in cents
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Portal Access */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Management</h3>
            <p className="text-gray-600">Manage your subscription, payment methods, and billing history.</p>
          </div>
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {portalLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            {portalLoading ? 'Opening...' : 'Manage Billing'}
          </button>
        </div>
      </div>

      {/* Current Subscription */}
      {customer?.subscription && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium text-gray-900">{customer.subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                customer.subscription.status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {customer.subscription.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Billing</p>
              <p className="font-medium text-gray-900">
                {customer.subscription.currentPeriodEnd.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    {method.card && (
                      <>
                        <p className="font-medium text-gray-900">
                          {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} •••• {method.card.last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires {method.card.expMonth}/{method.card.expYear}
                        </p>
                      </>
                    )}
                    {method.bankAccount && (
                      <>
                        <p className="font-medium text-gray-900">
                          {method.bankAccount.bankName} •••• {method.bankAccount.last4}
                        </p>
                        <p className="text-sm text-gray-600">Bank Account</p>
                      </>
                    )}
                  </div>
                </div>
                {method.isDefault && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing History */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.created.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex space-x-2">
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
