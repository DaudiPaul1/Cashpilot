import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { db } from '../config/database';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const createSubscriptionSchema = z.object({
  priceId: z.string(),
  paymentMethodId: z.string().optional()
});

const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true)
});

const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string()
});

/**
 * @route   POST /api/stripe/create-subscription
 * @desc    Create a new subscription
 * @access  Private
 */
router.post('/create-subscription', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { priceId, paymentMethodId } = createSubscriptionSchema.parse(req.body);
    const userId = req.user.id;

    // Get user details
    const { data: user, error: userError } = await db.getUserById(userId);
    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await db.getUserSubscription(userId);
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'User already has an active subscription'
      });
    }

    let customerId = existingSubscription?.stripe_customer_id;

    // Create or get Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: userId
        }
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Save subscription to database
    const { error: dbError } = await db.query(async (client) => {
      return await client
        .from('subscriptions')
        .upsert([{
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end
        }], {
          onConflict: 'user_id'
        });
    });

    if (dbError) {
      console.error('Database error saving subscription:', dbError);
      // Don't fail the request, just log the error
    }

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent?.client_secret,
        status: subscription.status
      },
      message: 'Subscription created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

/**
 * @route   GET /api/stripe/subscription
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/subscription', authenticate, rateLimit(100, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;

    // Get subscription from database
    const { data: subscription, error } = await db.getUserSubscription(userId);

    if (error) {
      console.error('Database error getting subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load subscription'
      });
    }

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          subscription: null,
          status: 'no_subscription'
        }
      });
    }

    // Get detailed subscription info from Stripe
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Stripe error retrieving subscription:', stripeError);
      }
    }

    res.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          stripeData: stripeSubscription
        },
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/stripe/cancel-subscription
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/cancel-subscription', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { cancelAtPeriodEnd } = cancelSubscriptionSchema.parse(req.body);
    const userId = req.user.id;

    // Get subscription from database
    const { data: subscription, error } = await db.getUserSubscription(userId);

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    if (!subscription.stripe_subscription_id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription'
      });
    }

    // Cancel subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd
    });

    // Update subscription in database
    const { error: updateError } = await db.query(async (client) => {
      return await client
        .from('subscriptions')
        .update({
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          canceled_at: updatedSubscription.canceled_at ? new Date(updatedSubscription.canceled_at * 1000) : null
        })
        .eq('user_id', userId);
    });

    if (updateError) {
      console.error('Database error updating subscription:', updateError);
    }

    res.json({
      success: true,
      data: {
        subscription: updatedSubscription,
        canceledAt: updatedSubscription.canceled_at ? new Date(updatedSubscription.canceled_at * 1000) : null
      },
      message: cancelAtPeriodEnd ? 'Subscription will be canceled at the end of the current period' : 'Subscription canceled immediately'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * @route   POST /api/stripe/update-payment-method
 * @desc    Update payment method for subscription
 * @access  Private
 */
router.post('/update-payment-method', authenticate, rateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { paymentMethodId } = updatePaymentMethodSchema.parse(req.body);
    const userId = req.user.id;

    // Get subscription from database
    const { data: subscription, error } = await db.getUserSubscription(userId);

    if (error || !subscription?.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Update payment method in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      default_payment_method: paymentMethodId
    });

    res.json({
      success: true,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      });
    }

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment method'
    });
  }
});

/**
 * @route   POST /api/stripe/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancel(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const { error } = await db.query(async (client) => {
      return await client
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
        })
        .eq('stripe_subscription_id', subscription.id);
    });

    if (error) {
      console.error('Database error updating subscription:', error);
    }
  } catch (error) {
    console.error('Handle subscription update error:', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancel(subscription: Stripe.Subscription) {
  try {
    const { error } = await db.query(async (client) => {
      return await client
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date(subscription.canceled_at! * 1000)
        })
        .eq('stripe_subscription_id', subscription.id);
    });

    if (error) {
      console.error('Database error canceling subscription:', error);
    }
  } catch (error) {
    console.error('Handle subscription cancel error:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const { error } = await db.query(async (client) => {
        return await client
          .from('subscriptions')
          .update({
            last_payment_date: new Date(),
            last_payment_failed: null
          })
          .eq('stripe_subscription_id', invoice.subscription as string);
      });

      if (error) {
        console.error('Database error updating payment date:', error);
      }
    }
  } catch (error) {
    console.error('Handle payment succeeded error:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const { error } = await db.query(async (client) => {
        return await client
          .from('subscriptions')
          .update({
            last_payment_failed: new Date()
          })
          .eq('stripe_subscription_id', invoice.subscription as string);
      });

      if (error) {
        console.error('Database error updating failed payment:', error);
      }
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

/**
 * @route   GET /api/stripe/prices
 * @desc    Get available subscription prices
 * @access  Public
 */
router.get('/prices', rateLimit(100, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    res.json({
      success: true,
      data: {
        prices: prices.data
      }
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load prices'
    });
  }
});

export default router;
