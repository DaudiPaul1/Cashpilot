import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Up to 100 transactions per month',
      'Basic financial insights',
      'Manual data entry',
      'Email support'
    ],
    limits: {
      transactions: 100,
      integrations: 0,
      aiInsights: 5,
      exports: 1
    }
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      'Up to 1,000 transactions per month',
      'Advanced financial insights',
      'Shopify integration',
      'CSV import/export',
      'Priority email support',
      'Basic AI insights'
    ],
    limits: {
      transactions: 1000,
      integrations: 1,
      aiInsights: 20,
      exports: 10
    }
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 79,
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    features: [
      'Unlimited transactions',
      'All integrations (Shopify, QuickBooks)',
      'Advanced AI insights',
      'Custom reporting',
      'Priority support',
      'Team collaboration',
      'API access'
    ],
    limits: {
      transactions: -1, // Unlimited
      integrations: -1, // Unlimited
      aiInsights: -1, // Unlimited
      exports: -1 // Unlimited
    }
  }
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

export interface Subscription {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  priceId: string;
  quantity: number;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  created: Date;
  subscription?: Subscription;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created: Date;
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
    routingNumber: string;
  };
  isDefault: boolean;
}
