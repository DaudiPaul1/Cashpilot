import { stripe, SUBSCRIPTION_PLANS, Subscription, Customer, Invoice, PaymentMethod } from './client';

/**
 * Create a new customer in Stripe
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Customer> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      ...metadata,
      created_at: new Date().toISOString()
    }
  });

  return {
    id: customer.id,
    email: customer.email!,
    name: customer.name || undefined,
    phone: customer.phone || undefined,
    address: customer.address || undefined,
    created: new Date(customer.created * 1000)
  };
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return null;
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    const subscription = subscriptions.data[0];
    let subscriptionData: Subscription | undefined;

    if (subscription) {
      const plan = Object.entries(SUBSCRIPTION_PLANS).find(([, plan]) => 
        plan.stripePriceId === subscription.items.data[0].price.id
      )?.[0] as keyof typeof SUBSCRIPTION_PLANS;

      subscriptionData = {
        id: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status as Subscription['status'],
        plan: plan || 'FREE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        priceId: subscription.items.data[0].price.id,
        quantity: subscription.items.data[0].quantity || 1
      };
    }

    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
      created: new Date(customer.created * 1000),
      subscription: subscriptionData
    };
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null;
  }
}

/**
 * Create a subscription for a customer
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays?: number
): Promise<Subscription> {
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent']
  };

  if (trialDays) {
    subscriptionData.trial_period_days = trialDays;
  }

  const subscription = await stripe.subscriptions.create(subscriptionData);

  const plan = Object.entries(SUBSCRIPTION_PLANS).find(([, plan]) => 
    plan.stripePriceId === priceId
  )?.[0] as keyof typeof SUBSCRIPTION_PLANS;

  return {
    id: subscription.id,
    customerId: subscription.customer as string,
    status: subscription.status as Subscription['status'],
    plan: plan || 'FREE',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    priceId: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity || 1
  };
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  const subscription = cancelAtPeriodEnd
    ? await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    : await stripe.subscriptions.cancel(subscriptionId);

  const plan = Object.entries(SUBSCRIPTION_PLANS).find(([, plan]) => 
    plan.stripePriceId === subscription.items.data[0].price.id
  )?.[0] as keyof typeof SUBSCRIPTION_PLANS;

  return {
    id: subscription.id,
    customerId: subscription.customer as string,
    status: subscription.status as Subscription['status'],
    plan: plan || 'FREE',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    priceId: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity || 1
  };
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations'
  });

  const plan = Object.entries(SUBSCRIPTION_PLANS).find(([, plan]) => 
    plan.stripePriceId === newPriceId
  )?.[0] as keyof typeof SUBSCRIPTION_PLANS;

  return {
    id: updatedSubscription.id,
    customerId: updatedSubscription.customer as string,
    status: updatedSubscription.status as Subscription['status'],
    plan: plan || 'FREE',
    currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
    trialEnd: updatedSubscription.trial_end ? new Date(updatedSubscription.trial_end * 1000) : undefined,
    priceId: updatedSubscription.items.data[0].price.id,
    quantity: updatedSubscription.items.data[0].quantity || 1
  };
}

/**
 * Get customer invoices
 */
export async function getCustomerInvoices(customerId: string): Promise<Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 50
  });

  return invoices.data.map(invoice => ({
    id: invoice.id,
    number: invoice.number!,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status as Invoice['status'],
    created: new Date(invoice.created * 1000),
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
    paidAt: invoice.status === 'paid' ? new Date(invoice.created * 1000) : undefined,
    pdfUrl: invoice.invoice_pdf || undefined,
    hostedInvoiceUrl: invoice.hosted_invoice_url || undefined
  }));
}

/**
 * Get customer payment methods
 */
export async function getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card'
  });

  return paymentMethods.data.map(pm => ({
    id: pm.id,
    type: pm.type as 'card' | 'bank_account',
    card: pm.card ? {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year
    } : undefined,
    bankAccount: pm.bank_account ? {
      bankName: pm.bank_account.bank_name || '',
      last4: pm.bank_account.last4,
      routingNumber: pm.bank_account.routing_number || ''
    } : undefined,
    isDefault: false // Would need to check against customer's default payment method
  }));
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    metadata: {
      customer_id: customerId
    }
  });

  return {
    sessionId: session.id,
    url: session.url!
  };
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

/**
 * Check if user has access to feature based on subscription
 */
export function hasFeatureAccess(
  subscription: Subscription | undefined,
  feature: 'transactions' | 'integrations' | 'aiInsights' | 'exports',
  currentUsage: number = 0
): boolean {
  if (!subscription || subscription.status !== 'active') {
    // Free plan limits
    const freeLimits = SUBSCRIPTION_PLANS.FREE.limits;
    return currentUsage < freeLimits[feature];
  }

  const planLimits = SUBSCRIPTION_PLANS[subscription.plan].limits;
  const limit = planLimits[feature];

  // -1 means unlimited
  if (limit === -1) {
    return true;
  }

  return currentUsage < limit;
}

/**
 * Get remaining usage for a feature
 */
export function getRemainingUsage(
  subscription: Subscription | undefined,
  feature: 'transactions' | 'integrations' | 'aiInsights' | 'exports',
  currentUsage: number = 0
): number {
  if (!subscription || subscription.status !== 'active') {
    const freeLimits = SUBSCRIPTION_PLANS.FREE.limits;
    const limit = freeLimits[feature];
    return Math.max(0, limit - currentUsage);
  }

  const planLimits = SUBSCRIPTION_PLANS[subscription.plan].limits;
  const limit = planLimits[feature];

  if (limit === -1) {
    return -1; // Unlimited
  }

  return Math.max(0, limit - currentUsage);
}
