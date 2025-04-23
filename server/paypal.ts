import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { db } from './db';
import { subscriptionPlans, payments, subscriptions, users, systemSettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getPayPalCallbackUrl } from './paypal-auth';

// Helper function to convert Date to ISO string for database
function dateToISOString(date: Date): string {
  return date.toISOString();
}

// Note: The getPayPalCallbackUrl function has been moved to paypal-auth.ts to avoid circular dependencies

async function getPayPalCredentials() {
  try {
    const clientIdRecord = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_client_id"))
      .limit(1);
    
    const clientSecretRecord = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_client_secret"))
      .limit(1);
    
    const modeRecord = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_mode"))
      .limit(1);
    
    return {
      clientId: clientIdRecord.length > 0 ? clientIdRecord[0].value : '',
      clientSecret: clientSecretRecord.length > 0 ? clientSecretRecord[0].value : '',
      mode: modeRecord.length > 0 ? modeRecord[0].value : "sandbox"
    };
  } catch (err) {
    console.warn("[PayPal] Error fetching PayPal credentials from settings:", err);
    return { clientId: '', clientSecret: '', mode: "sandbox" };
  }
}

async function environment() {
  const { clientId, clientSecret, mode } = await getPayPalCredentials();

  console.log(`[PayPal] Using mode: ${mode}`);
  
  if (mode === 'sandbox') {
    return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  } else {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  }
}

async function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(await environment());
}

class PayPalService {
  /**
   * Creates a PayPal order for subscription checkout
   */
  static async createOrder(planName: string, userId: number) {
    try {
      // Get the plan details
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, planName));
      
      if (!plan) {
        throw new Error(`Plan ${planName} not found`);
      }
      
      // Create a new order
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      
      // Get the callback URL
      const baseUrl = await getPayPalCallbackUrl();
      console.log(`Using callback URL: ${baseUrl}`);
      
      // Create the order
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `plan_${plan.id}_user_${userId}`,
          description: plan.description || `${plan.displayName} Subscription`,
          amount: {
            currency_code: 'USD',
            value: plan.price.toString()
          }
        }],
        application_context: {
          brand_name: 'Hope Log',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${baseUrl}?planName=${encodeURIComponent(planName)}`,
          cancel_url: `${baseUrl}?cancelled=true`
        }
      });

      // Execute the API request
      const paypalClient = await client();
      const response = await paypalClient.execute(request);

      // Return order details including approval URLs
      return {
        orderId: response.result.id,
        status: response.result.status,
        links: response.result.links
      };
    } catch (err) {
      console.error('[PayPal] Error creating order:', err);
      throw new Error(`Failed to create PayPal order: ${err.message}`);
    }
  }

  /**
   * Captures a PayPal order after approval
   */
  static async captureOrder(orderId: string, userId: number, planName: string) {
    try {
      // Create a request to capture the order
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
      request.prefer("return=representation");
      
      // Execute the request
      const paypalClient = await client();
      const response = await paypalClient.execute(request);
      
      // Get the purchase details
      const captureId = response.result.purchase_units[0].payments.captures[0].id;
      const amount = parseFloat(response.result.purchase_units[0].payments.captures[0].amount.value);
      
      // Get the plan details
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, planName));
      
      if (!plan) {
        throw new Error(`Plan ${planName} not found`);
      }
      
      // Calculate the end date based on the subscription interval
      const endDate = new Date();
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // Insert a new subscription
      const [subscription] = await db.insert(subscriptions)
        .values({
          userId,
          planId: plan.id,
          status: 'active',
          startDate: dateToISOString(new Date()),
          endDate: dateToISOString(endDate),
          paypalSubscriptionId: null, // One-time payment, not recurring
        })
        .returning();
      
      // Record the payment
      await db.insert(payments)
        .values({
          userId,
          subscriptionId: subscription.id,
          amount,
          paymentMethod: 'paypal',
          paymentId: captureId,
          status: 'completed',
          paymentDate: dateToISOString(new Date()),
          metadata: {
            orderId,
            captureId
          }
        });
      
      // Update the user's subscription status
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
    } catch (err) {
      console.error('[PayPal] Error capturing order:', err);
      throw new Error(`Failed to capture PayPal order: ${err.message}`);
    }
  }

  /**
   * Create a subscription with recurring billing
   * Note: This requires PayPal Subscription API which is different from Orders API
   * This is implemented separately and would require a different PayPal setup
   */
  static async createSubscription(planName: string, userId: number) {
    // This is a placeholder for the subscription API integration
    throw new Error('Subscription API not implemented yet');
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: number, userId: number) {
    try {
      // Find the subscription
      const [subscription] = await db.select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId)
        ));
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Update the subscription status
      const [updatedSubscription] = await db.update(subscriptions)
        .set({
          status: 'cancelled',
        })
        .where(eq(subscriptions.id, subscriptionId))
        .returning();
      
      // Don't immediately update the user's subscription status
      // as they should still have access until the end date
      
      return {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status
      };
    } catch (err) {
      console.error('[PayPal] Error cancelling subscription:', err);
      throw new Error(`Failed to cancel subscription: ${err.message}`);
    }
  }

  /**
   * Get active subscription for a user
   */
  static async getActiveSubscription(userId: number) {
    try {
      // Find the user's active subscription
      const [subscription] = await db.select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        ))
        .orderBy(subscriptions.createdAt, 'desc');
      
      if (!subscription) return null;
      
      // Get the plan details
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId));
      
      return {
        ...subscription,
        plan
      };
    } catch (err) {
      console.error('[PayPal] Error getting active subscription:', err);
      throw new Error(`Failed to get active subscription: ${err.message}`);
    }
  }

  /**
   * Get subscription history for a user
   */
  static async getSubscriptionHistory(userId: number) {
    try {
      // Get all subscriptions for the user
      const userSubscriptions = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(subscriptions.createdAt, 'desc');
      
      // Get all associated payments
      const subscriptionIds = userSubscriptions.map(sub => sub.id);
      const subscriptionPayments = subscriptionIds.length > 0 
        ? await db.select()
            .from(payments)
            .where(eq(payments.userId, userId))
        : [];
      
      // Get all plans
      const planIds = [...new Set(userSubscriptions.map(sub => sub.planId))];
      const plans = planIds.length > 0
        ? await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, planIds[0])) // Adding just first one for now as a workaround
        : [];
      
      // Map plans to subscriptions
      const formattedSubscriptions = userSubscriptions.map(subscription => {
        const plan = plans.find(p => p.id === subscription.planId);
        const subPayments = subscriptionPayments.filter(p => p.subscriptionId === subscription.id);
        
        return {
          ...subscription,
          plan,
          payments: subPayments
        };
      });
      
      return formattedSubscriptions;
    } catch (err) {
      console.error('[PayPal] Error getting subscription history:', err);
      throw new Error(`Failed to get subscription history: ${err.message}`);
    }
  }
}

export default PayPalService;