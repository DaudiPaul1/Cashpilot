import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { withSecurityAndCors } from '@/lib/security/headers';
import { createRateLimitedAPI, apiRateLimiter } from '@/lib/security/rateLimiter';
import { 
  createCustomer, 
  getCustomer, 
  createSubscription, 
  cancelSubscription,
  updateSubscription,
  getCustomerInvoices,
  getCustomerPaymentMethods,
  createCheckoutSession,
  createBillingPortalSession
} from '@/lib/stripe/subscriptions';

// Create rate-limited and secured API handler
const handler = createRateLimitedAPI(apiRateLimiter, async (request: NextRequest) => {
  return requireAuth(async (req: NextRequest, user: any) => {
    try {
      const { method } = req;
      const body = await req.json().catch(() => ({}));

      switch (method) {
        case 'POST':
          return await handlePostRequest(req, user, body);
        case 'GET':
          return await handleGetRequest(req, user);
        case 'PUT':
          return await handlePutRequest(req, user, body);
        case 'DELETE':
          return await handleDeleteRequest(req, user, body);
        default:
          return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
      }
    } catch (error) {
      console.error('Stripe API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
});

async function handlePostRequest(req: NextRequest, user: any, body: any) {
  const { action } = body;

  switch (action) {
    case 'create_customer':
      const { email, name, metadata } = body;
      const customer = await createCustomer(email || user.email, name, metadata);
      return NextResponse.json({ success: true, customer });

    case 'create_subscription':
      const { priceId, trialDays } = body;
      if (!priceId) {
        return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
      }
      
      // Get or create customer
      let customerData = await getCustomer(user.uid);
      if (!customerData) {
        customerData = await createCustomer(user.email, user.displayName, { firebase_uid: user.uid });
      }
      
      const subscription = await createSubscription(customerData.id, priceId, trialDays);
      return NextResponse.json({ success: true, subscription });

    case 'create_checkout_session':
      const { priceId: checkoutPriceId, successUrl, cancelUrl } = body;
      if (!checkoutPriceId || !successUrl || !cancelUrl) {
        return NextResponse.json({ error: 'Price ID, success URL, and cancel URL are required' }, { status: 400 });
      }
      
      let checkoutCustomer = await getCustomer(user.uid);
      if (!checkoutCustomer) {
        checkoutCustomer = await createCustomer(user.email, user.displayName, { firebase_uid: user.uid });
      }
      
      const session = await createCheckoutSession(checkoutCustomer.id, checkoutPriceId, successUrl, cancelUrl);
      return NextResponse.json({ success: true, session });

    case 'create_billing_portal':
      const { returnUrl } = body;
      if (!returnUrl) {
        return NextResponse.json({ error: 'Return URL is required' }, { status: 400 });
      }
      
      let portalCustomer = await getCustomer(user.uid);
      if (!portalCustomer) {
        return NextResponse.json({ error: 'No customer found' }, { status: 404 });
      }
      
      const portalSession = await createBillingPortalSession(portalCustomer.id, returnUrl);
      return NextResponse.json({ success: true, session: portalSession });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handleGetRequest(req: NextRequest, user: any) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'customer':
      const customer = await getCustomer(user.uid);
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, customer });

    case 'invoices':
      const customerForInvoices = await getCustomer(user.uid);
      if (!customerForInvoices) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      
      const invoices = await getCustomerInvoices(customerForInvoices.id);
      return NextResponse.json({ success: true, invoices });

    case 'payment_methods':
      const customerForPaymentMethods = await getCustomer(user.uid);
      if (!customerForPaymentMethods) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      
      const paymentMethods = await getCustomerPaymentMethods(customerForPaymentMethods.id);
      return NextResponse.json({ success: true, paymentMethods });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handlePutRequest(req: NextRequest, user: any, body: any) {
  const { action } = body;

  switch (action) {
    case 'update_subscription':
      const { subscriptionId, newPriceId } = body;
      if (!subscriptionId || !newPriceId) {
        return NextResponse.json({ error: 'Subscription ID and new price ID are required' }, { status: 400 });
      }
      
      const updatedSubscription = await updateSubscription(subscriptionId, newPriceId);
      return NextResponse.json({ success: true, subscription: updatedSubscription });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handleDeleteRequest(req: NextRequest, user: any, body: any) {
  const { action } = body;

  switch (action) {
    case 'cancel_subscription':
      const { subscriptionId, cancelAtPeriodEnd = true } = body;
      if (!subscriptionId) {
        return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
      }
      
      const canceledSubscription = await cancelSubscription(subscriptionId, cancelAtPeriodEnd);
      return NextResponse.json({ success: true, subscription: canceledSubscription });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export const POST = withSecurityAndCors(handler);
export const GET = withSecurityAndCors(handler);
export const PUT = withSecurityAndCors(handler);
export const DELETE = withSecurityAndCors(handler);
