"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const stripe_1 = __importDefault(require("stripe"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env['STRIPE_SECRET_KEY'], {
    apiVersion: '2023-10-16',
});
const createSubscriptionSchema = zod_1.z.object({
    priceId: zod_1.z.string(),
    paymentMethodId: zod_1.z.string().optional()
});
const cancelSubscriptionSchema = zod_1.z.object({
    cancelAtPeriodEnd: zod_1.z.boolean().default(true)
});
const updatePaymentMethodSchema = zod_1.z.object({
    paymentMethodId: zod_1.z.string()
});
router.post('/create-subscription', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { priceId, paymentMethodId } = createSubscriptionSchema.parse(req.body);
        const userId = req.user.id;
        const { data: user, error: userError } = await database_1.db.getUserById(userId);
        if (userError || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const { data: existingSubscription } = await database_1.db.getUserSubscription(userId);
        if (existingSubscription && existingSubscription.status === 'active') {
            return res.status(400).json({
                success: false,
                error: 'User already has an active subscription'
            });
        }
        let customerId = existingSubscription?.stripe_customer_id;
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
        const subscriptionData = {
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
        const { error: dbError } = await database_1.db.query(async (client) => {
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
        }
        res.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
                status: subscription.status
            },
            message: 'Subscription created successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: error.errors
            });
        }
        if (error instanceof stripe_1.default.errors.StripeError) {
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
router.get('/subscription', auth_1.authenticate, (0, auth_1.rateLimit)(100, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const userId = req.user.id;
        const { data: subscription, error } = await database_1.db.getUserSubscription(userId);
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
        let stripeSubscription = null;
        if (subscription.stripe_subscription_id) {
            try {
                stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
            }
            catch (stripeError) {
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
    }
    catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/cancel-subscription', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { cancelAtPeriodEnd } = cancelSubscriptionSchema.parse(req.body);
        const userId = req.user.id;
        const { data: subscription, error } = await database_1.db.getUserSubscription(userId);
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
        const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: cancelAtPeriodEnd
        });
        const { error: updateError } = await database_1.db.query(async (client) => {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: error.errors
            });
        }
        if (error instanceof stripe_1.default.errors.StripeError) {
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
router.post('/update-payment-method', auth_1.authenticate, (0, auth_1.rateLimit)(10, 15 * 60 * 1000), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { paymentMethodId } = updatePaymentMethodSchema.parse(req.body);
        const userId = req.user.id;
        const { data: subscription, error } = await database_1.db.getUserSubscription(userId);
        if (error || !subscription?.stripe_subscription_id) {
            return res.status(404).json({
                success: false,
                error: 'No active subscription found'
            });
        }
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            default_payment_method: paymentMethodId
        });
        res.json({
            success: true,
            message: 'Payment method updated successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                details: error.errors
            });
        }
        if (error instanceof stripe_1.default.errors.StripeError) {
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
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) {
        console.error('Stripe webhook secret not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
    }
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionCancel(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});
async function handleSubscriptionUpdate(subscription) {
    try {
        const { error } = await database_1.db.query(async (client) => {
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
    }
    catch (error) {
        console.error('Handle subscription update error:', error);
    }
}
async function handleSubscriptionCancel(subscription) {
    try {
        const { error } = await database_1.db.query(async (client) => {
            return await client
                .from('subscriptions')
                .update({
                status: 'canceled',
                canceled_at: new Date(subscription.canceled_at * 1000)
            })
                .eq('stripe_subscription_id', subscription.id);
        });
        if (error) {
            console.error('Database error canceling subscription:', error);
        }
    }
    catch (error) {
        console.error('Handle subscription cancel error:', error);
    }
}
async function handlePaymentSucceeded(invoice) {
    try {
        if (invoice.subscription) {
            const { error } = await database_1.db.query(async (client) => {
                return await client
                    .from('subscriptions')
                    .update({
                    last_payment_date: new Date(),
                    last_payment_failed: null
                })
                    .eq('stripe_subscription_id', invoice.subscription);
            });
            if (error) {
                console.error('Database error updating payment date:', error);
            }
        }
    }
    catch (error) {
        console.error('Handle payment succeeded error:', error);
    }
}
async function handlePaymentFailed(invoice) {
    try {
        if (invoice.subscription) {
            const { error } = await database_1.db.query(async (client) => {
                return await client
                    .from('subscriptions')
                    .update({
                    last_payment_failed: new Date()
                })
                    .eq('stripe_subscription_id', invoice.subscription);
            });
            if (error) {
                console.error('Database error updating failed payment:', error);
            }
        }
    }
    catch (error) {
        console.error('Handle payment failed error:', error);
    }
}
router.get('/prices', (0, auth_1.rateLimit)(100, 15 * 60 * 1000), async (req, res) => {
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
    }
    catch (error) {
        console.error('Get prices error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load prices'
        });
    }
});
exports.default = router;
//# sourceMappingURL=stripe.js.map