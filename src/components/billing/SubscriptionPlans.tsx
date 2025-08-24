'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/store/useStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/stripe/client';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  BarChart3,
  CreditCard,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface SubscriptionPlansProps {
  currentPlan?: SubscriptionPlan;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
  showCurrentPlan?: boolean;
}

export default function SubscriptionPlans({ 
  currentPlan = 'FREE', 
  onPlanSelect,
  showCurrentPlan = true 
}: SubscriptionPlansProps) {
  const { user } = useAuth();
  const { addNotification } = useData();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) {
      addNotification({
        type: 'info',
        title: 'Current Plan',
        message: 'You are already on this plan.'
      });
      return;
    }

    if (plan === 'FREE') {
      // Handle downgrade to free
      addNotification({
        type: 'warning',
        title: 'Plan Change',
        message: 'Please contact support to downgrade your plan.'
      });
      return;
    }

    setLoading(plan);

    try {
      const planData = SUBSCRIPTION_PLANS[plan];
      if (!planData.stripePriceId) {
        throw new Error('Plan not configured');
      }

      // Create checkout session
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          action: 'create_checkout_session',
          priceId: planData.stripePriceId,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { session } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error selecting plan:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to process plan selection. Please try again.'
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'FREE':
        return <Shield className="h-6 w-6" />;
      case 'STARTER':
        return <Zap className="h-6 w-6" />;
      case 'PROFESSIONAL':
        return <Star className="h-6 w-6" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'FREE':
        return 'border-gray-200 bg-white';
      case 'STARTER':
        return 'border-blue-200 bg-blue-50';
      case 'PROFESSIONAL':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getButtonColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-600 hover:bg-gray-700';
      case 'STARTER':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'PROFESSIONAL':
        return 'bg-purple-600 hover:bg-purple-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
        const isCurrentPlan = planKey === currentPlan;
        const isPopular = planKey === 'STARTER';
        
        return (
          <div
            key={planKey}
            className={`relative rounded-xl border-2 p-6 ${getPlanColor(planKey as SubscriptionPlan)} ${
              isCurrentPlan ? 'ring-2 ring-blue-500' : ''
            } ${isPopular ? 'scale-105' : ''}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {isCurrentPlan && showCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  planKey === 'FREE' ? 'bg-gray-100' :
                  planKey === 'STARTER' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  {getPlanIcon(planKey as SubscriptionPlan)}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-600">/month</span>}
              </div>

              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(planKey as SubscriptionPlan)}
                disabled={loading === planKey || isCurrentPlan}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                  isCurrentPlan 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : getButtonColor(planKey as SubscriptionPlan)
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === planKey ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : (
                  <div className="flex items-center justify-center">
                    {plan.price === 0 ? 'Get Started' : 'Upgrade Now'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
