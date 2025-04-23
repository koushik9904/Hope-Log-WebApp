import { makePayPalRequest, getPayPalAccessToken, getPayPalCallbackUrl } from './paypal-auth';
import { db } from './db';
import { subscriptionPlans, payments, subscriptions, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to convert Date to ISO string for database
function dateToISOString(date: Date): string {
  return date.toISOString();
}

export class PayPalRestService {
  /**
   * Creates a PayPal order using the REST API with OAuth
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
    
    // Get callback URL
    const baseUrl = await getPayPalCallbackUrl();
    console.log(`[PayPal] Using callback URL base: ${baseUrl}`);
    
    // Create return and cancel URLs
    // Note: PayPal uses 'token' as the parameter name for the order ID
    const returnUrl = `${baseUrl}?planName=${encodeURIComponent(planName)}`;
    const cancelUrl = `${baseUrl}?cancelled=true`;
    
    console.log(`[PayPal] Return URL: ${returnUrl}`);
    console.log(`[PayPal] Cancel URL: ${cancelUrl}`);
    
    // Create request body
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
    
    try {
      // Use OAuth 2.0 access token to create the order
      console.log(`[PayPal] Making REST API request to create order`);
      const order = await makePayPalRequest('post', '/v2/checkout/orders', requestBody, {
        'Prefer': 'return=representation'
      });
      
      console.log(`[PayPal] Order created successfully:`, JSON.stringify(order, null, 2));
      
      // Extract and log the approval URL for debugging
      const links = order.links || [];
      const approvalLink = links.find((link: any) => link.rel === "approve");
      
      if (approvalLink) {
        console.log(`[PayPal] Approval URL: ${approvalLink.href}`);
      } else {
        console.warn(`[PayPal] No approval URL found in response`);
      }
      
      return {
        orderId: order.id,
        status: order.status,
        links: order.links
      };
    } catch (err: any) {
      console.error('[PayPal] Error creating order:', err);
      
      // Try to extract more helpful error information
      let errorMessage = 'Failed to create PayPal order';
      
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Captures a PayPal order after approval using REST API with OAuth
   */
  static async captureOrder(orderId: string, userId: number, planName: string) {
    console.log(`[PayPal] Capturing order: ${orderId} for user: ${userId}, plan: ${planName}`);
    
    try {
      console.log(`[PayPal] Making REST API request to capture order`);
      const captureResult = await makePayPalRequest('post', `/v2/checkout/orders/${orderId}/capture`, {}, {
        'Prefer': 'return=representation'
      });
      
      console.log(`[PayPal] Order captured successfully:`, JSON.stringify(captureResult, null, 2));
      
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
      
      if (err.message) {
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
}