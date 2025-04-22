import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { db } from './db';
import { subscriptionPlans, payments, subscriptions, users, systemSettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to convert Date to ISO string for database
function dateToISOString(date: Date): string {
  return date.toISOString();
}

// Get PayPal callback URL from database or default
async function getPayPalCallbackUrl() {
  try {
    const callbackUrlSettings = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_callback_url"))
      .limit(1);
    
    if (callbackUrlSettings.length > 0 && callbackUrlSettings[0].value) {
      return callbackUrlSettings[0].value;
    }
  } catch (err) {
    console.warn("Error fetching PayPal callback URL from settings:", err);
  }
  
  // Default fallback URL
  return process.env.APP_URL || 'https://hopelog.com';
}

// Get PayPal credentials from database
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
      clientId: clientIdRecord.length > 0 ? clientIdRecord[0].value : null,
      clientSecret: clientSecretRecord.length > 0 ? clientSecretRecord[0].value : null,
      mode: modeRecord.length > 0 ? modeRecord[0].value : "sandbox"
    };
  } catch (err) {
    console.warn("Error fetching PayPal credentials from settings:", err);
    return { clientId: null, clientSecret: null, mode: "sandbox" };
  }
}

// Creating an environment
async function environment() {
  // Try to get from environment variables first
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  // If not in environment, get from database
  if (!clientId || !clientSecret) {
    const credentials = await getPayPalCredentials();
    clientId = credentials.clientId || clientId;
    clientSecret = credentials.clientSecret || clientSecret;
    
    // Set them as environment variables for future use
    if (credentials.clientId) process.env.PAYPAL_CLIENT_ID = credentials.clientId;
    if (credentials.clientSecret) process.env.PAYPAL_CLIENT_SECRET = credentials.clientSecret;
    
    // Check if we're in sandbox or live mode
    const isProduction = credentials.mode === "live";
    
    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not found. Please set them in the admin settings.');
    }
    
    return isProduction
      ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
      : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  }

  // Default case with env variables
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction
    ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

// Creating a client
async function client() {
  const env = await environment();
  return new checkoutNodeJssdk.core.PayPalHttpClient(env);
}

class PayPalService {
  /**
   * Creates a PayPal order for subscription checkout
   */
  static async createOrder(planName: string, userId: number) {
    console.log(`[PayPal] Creating order for plan: ${planName}, userId: ${userId}`);
    
    // Get the subscription plan
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, planName));
    
    if (!plan) {
      console.error(`[PayPal] Subscription plan '${planName}' not found`);
      throw new Error(`Subscription plan '${planName}' not found`);
    }
    
    console.log(`[PayPal] Found plan:`, plan);
    
    // Get callback URL from settings or use default
    const baseUrl = await getPayPalCallbackUrl();
    console.log(`[PayPal] Using callback URL base: ${baseUrl}`);
    
    // Create return and cancel URLs
    // PayPal will replace 'token' in query string with actual token/orderId
    const returnUrl = `${baseUrl}?planName=${encodeURIComponent(planName)}&token=PAYPAL_TOKEN`;
    const cancelUrl = `${baseUrl}?cancelled=true`;
    
    console.log(`[PayPal] Return URL: ${returnUrl}`);
    console.log(`[PayPal] Cancel URL: ${cancelUrl}`);
    
    // Create the PayPal order
    console.log(`[PayPal] Creating OrdersCreateRequest`);
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    
    const requestBody = {
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
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    };
    
    console.log(`[PayPal] Request body:`, JSON.stringify(requestBody, null, 2));
    request.requestBody(requestBody);

    try {
      console.log(`[PayPal] Getting PayPal client`);
      const paypalClient = await client();
      
      console.log(`[PayPal] Executing PayPal order request`);
      const order = await paypalClient.execute(request);
      
      console.log(`[PayPal] Order created successfully:`, JSON.stringify(order.result, null, 2));
      
      // Extract and log the approval URL for debugging
      const result = order.result as any; // Type assertion for TypeScript
      const links = result.links || [];
      const approvalLink = links.find((link: any) => link.rel === "approve");
      
      if (approvalLink) {
        console.log(`[PayPal] Approval URL: ${approvalLink.href}`);
      } else {
        console.warn(`[PayPal] No approval URL found in response`);
      }
      
      return {
        orderId: result.id,
        status: result.status,
        links: result.links
      };
    } catch (err: any) {
      console.error('[PayPal] Error creating order:', err);
      console.error('[PayPal] Error details:', err.details || 'No details');
      
      // Try to extract more helpful error information
      let errorMessage = 'Failed to create PayPal order';
      
      if (err.details && Array.isArray(err.details)) {
        const details = err.details.map((detail: any) => detail.description || detail.issue).join(', ');
        errorMessage += `: ${details}`;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Captures a PayPal order after approval
   */
  static async captureOrder(orderId: string, userId: number, planName: string) {
    console.log(`[PayPal] Capturing order: ${orderId} for user: ${userId}, plan: ${planName}`);
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.prefer('return=representation');

    try {
      console.log(`[PayPal] Getting PayPal client for capture`);
      const paypalClient = await client();
      
      console.log(`[PayPal] Executing order capture request`);
      const capture = await paypalClient.execute(request);
      
      console.log(`[PayPal] Order captured successfully:`, JSON.stringify(capture.result, null, 2));
      
      // Type assertion for TypeScript
      const captureResult = capture.result as any;
      
      // Safely access and validate capture data
      if (!captureResult || !captureResult.purchase_units || 
          !captureResult.purchase_units[0] || !captureResult.purchase_units[0].payments || 
          !captureResult.purchase_units[0].payments.captures || 
          !captureResult.purchase_units[0].payments.captures[0]) {
        console.error(`[PayPal] Invalid capture response structure:`, captureResult);
        throw new Error('Invalid PayPal capture response');
      }
      
      // Get the transaction details
      const captureDetails = captureResult.purchase_units[0].payments.captures[0];
      const captureId = captureDetails.id;
      
      if (!captureDetails.amount || !captureDetails.amount.value) {
        console.error(`[PayPal] Missing amount in capture response:`, captureDetails);
        throw new Error('Missing amount in PayPal capture response');
      }
      
      const amount = parseFloat(captureDetails.amount.value);
      console.log(`[PayPal] Capture ID: ${captureId}, Amount: ${amount}`);
      
      // Get plan details
      console.log(`[PayPal] Looking up plan: ${planName}`);
      const [plan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, planName));
      
      if (!plan) {
        console.error(`[PayPal] Subscription plan '${planName}' not found`);
        throw new Error(`Subscription plan '${planName}' not found`);
      }
      console.log(`[PayPal] Found plan:`, plan);

      // Insert a new subscription
      const endDate = new Date();
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      console.log(`[PayPal] Subscription will end at: ${endDate.toISOString()}`);

      // Insert the subscription
      console.log(`[PayPal] Creating subscription record in database`);
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

      console.log(`[PayPal] Created subscription record:`, subscription);

      // Record the payment
      const paymentMetadata = {};
      try {
        // Safely extract data from PayPal response
        console.log(`[PayPal] Extracting payment metadata`);
        Object.assign(paymentMetadata, {
          id: captureResult.id,
          status: captureResult.status,
          payment_source: captureResult.payment_source || null
        });
      } catch (err) {
        console.warn('[PayPal] Could not extract all PayPal response details', err);
      }

      console.log(`[PayPal] Creating payment record in database`);
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
      console.log(`[PayPal] Updating user subscription status`);
      await db.update(users)
        .set({
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          subscriptionExpiresAt: dateToISOString(endDate)
        })
        .where(eq(users.id, userId));

      console.log(`[PayPal] Payment successfully processed and subscription activated`);
      return {
        subscriptionId: subscription.id,
        status: 'active',
        paymentStatus: 'completed',
        startDate: subscription.startDate,
        endDate: subscription.endDate
      };
    } catch (err: any) {
      console.error('[PayPal] Error capturing order:', err);
      
      // Try to extract more helpful error information
      let errorMessage = 'Failed to capture PayPal order';
      
      if (err.details && Array.isArray(err.details)) {
        const details = err.details.map((detail: any) => detail.description || detail.issue).join(', ');
        errorMessage += `: ${details}`;
        console.error('[PayPal] Error details:', details);
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      // Log the full error object to help with debugging
      try {
        console.error('[PayPal] Full error object:', JSON.stringify(err, null, 2));
      } catch (jsonErr) {
        console.error('[PayPal] Error converting error to JSON:', jsonErr);
        console.error('[PayPal] Error object:', err);
      }
      
      throw new Error(errorMessage);
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