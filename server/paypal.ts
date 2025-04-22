import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { db } from './db';
import { subscriptionPlans, payments, subscriptions, users, systemSettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to convert Date to ISO string for database
function dateToISOString(date: Date): string {
  return date.toISOString();
}

// Creating an environment
function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in environment variables');
  }

  // Check if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  return isProduction
    ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

// Creating a client
function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

class PayPalService {
  /**
   * Creates a PayPal order for subscription checkout
   */
  static async createOrder(planName: string, userId: number) {
    // Get the subscription plan
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, planName));
    
    if (!plan) {
      throw new Error(`Subscription plan '${planName}' not found`);
    }

    // Create the PayPal order
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `plan_${plan.id}_user_${userId}`,
        description: plan.description,
        amount: {
          currency_code: 'USD',
          value: plan.price.toString()
        }
      }],
      application_context: {
        brand_name: 'Hope Log',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.APP_URL || 'https://hopelog.ai'}/subscription?planName=${encodeURIComponent(planName)}`,
        cancel_url: `${process.env.APP_URL || 'https://hopelog.ai'}/subscription?cancelled=true`
      }
    });

    try {
      const order = await client().execute(request);
      return {
        orderId: (order.result as any).id,
        status: (order.result as any).status,
        links: (order.result as any).links
      };
    } catch (err: any) {
      console.error('Error creating PayPal order:', err);
      throw new Error(`Failed to create PayPal order: ${err?.message || ''}`);
    }
  }

  /**
   * Captures a PayPal order after approval
   */
  static async captureOrder(orderId: string, userId: number, planName: string) {
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.prefer('return=representation');

    try {
      const capture = await client().execute(request);
      
      // Get the transaction details
      const captureId = (capture.result as any).purchase_units[0].payments.captures[0].id;
      const amount = parseFloat((capture.result as any).purchase_units[0].payments.captures[0].amount.value);
      
      // Get plan details
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, planName));
      
      if (!plan) {
        throw new Error(`Subscription plan '${planName}' not found`);
      }

      // Insert a new subscription
      const endDate = new Date();
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Insert the subscription
      const [subscription] = await db.insert(subscriptions)
        .values({
          userId,
          planId: plan.id,
          status: 'active',
          startDate: dateToISOString(new Date()),
          endDate: dateToISOString(endDate),
          paypalSubscriptionId: null, // This is a one-time payment, not a recurring subscription
        })
        .returning();

      // Record the payment
      const paymentMetadata = {};
      try {
        // Safely extract data from PayPal response
        Object.assign(paymentMetadata, {
          id: (capture.result as any).id,
          status: (capture.result as any).status,
          payment_source: (capture.result as any).payment_source
        });
      } catch (err) {
        console.warn('Could not extract all PayPal response details', err);
      }

      await db.insert(payments)
        .values({
          userId,
          subscriptionId: subscription.id,
          amount,
          paymentMethod: 'paypal',
          paymentId: captureId,
          status: 'completed',
          paymentDate: dateToISOString(new Date()),
          metadata: paymentMetadata
        });

      // Update user's subscription status
      await db.update(users)
        .set({
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          subscriptionExpiresAt: dateToISOString(endDate)
        })
        .where(eq(users.id, userId));

      return {
        subscriptionId: subscription.id,
        status: 'active',
        paymentStatus: 'completed',
        startDate: subscription.startDate,
        endDate: subscription.endDate
      };
    } catch (err: any) {
      console.error('Error capturing PayPal order:', err);
      throw new Error(`Failed to capture PayPal order: ${err?.message || ''}`);
    }
  }

  /**
   * Create a subscription with recurring billing
   * Note: This requires PayPal Subscription API which is different from Orders API
   * This is implemented separately and would require a different PayPal setup
   */
  static async createSubscription(planName: string, userId: number) {
    // This would implement PayPal's Subscription API
    // Not implemented in this version as it requires additional setup
    throw new Error('PayPal recurring subscriptions not implemented');
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: number, userId: number) {
    // Get the subscription
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, userId)
      ));
    
    if (!subscription) {
      throw new Error(`Subscription not found or does not belong to user`);
    }

    // Update the subscription
    await db.update(subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: dateToISOString(new Date()),
        cancelAtPeriodEnd: true,
        updatedAt: dateToISOString(new Date())
      })
      .where(eq(subscriptions.id, subscriptionId));

    // Note: we don't immediately downgrade the user, they keep Pro access until the end date
    
    return {
      status: 'cancelled',
      message: 'Your subscription has been cancelled but will remain active until the end of your billing period.'
    };
  }

  /**
   * Get active subscription for a user
   */
  static async getActiveSubscription(userId: number) {
    const [subscription] = await db.select({
      subscription: subscriptions,
      plan: {
        name: subscriptionPlans.name,
        displayName: subscriptionPlans.displayName,
        price: subscriptionPlans.price,
        interval: subscriptionPlans.interval
      }
    })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .orderBy(subscriptions.createdAt);
    
    return subscription || null;
  }

  /**
   * Get subscription history for a user
   */
  static async getSubscriptionHistory(userId: number) {
    const subscriptionHistory = await db.select({
      subscription: subscriptions,
      plan: {
        name: subscriptionPlans.name,
        displayName: subscriptionPlans.displayName,
        price: subscriptionPlans.price,
        interval: subscriptionPlans.interval
      },
      payment: payments
    })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(payments, eq(subscriptions.id, payments.subscriptionId))
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.createdAt);
    
    return subscriptionHistory;
  }
}

export default PayPalService;