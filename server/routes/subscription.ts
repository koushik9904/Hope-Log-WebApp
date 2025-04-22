import { Router } from 'express';
import { db } from '../db';
import { subscriptionPlans, featureLimits } from '@shared/schema';
import PayPalService from '../paypal';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const router = Router();

// Schema for creating an order
const createOrderSchema = z.object({
  planName: z.string(),
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    // Get subscription plans
    const plans = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
    
    // Get feature limits for comparison
    const featureLimitsList = await db.select()
      .from(featureLimits);
    
    // Format the response with features comparison
    const formattedPlans = plans.map(plan => {
      // Find matching feature limits
      const tierName = plan.name.includes('pro') ? 'pro' : 'free';
      const limits = featureLimitsList.find(limit => limit.subscriptionTier === tierName);
      
      return {
        ...plan,
        // Add feature comparison details
        featureLimits: limits || null
      };
    });
    
    return res.status(200).json(formattedPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return res.status(500).json({ message: 'Failed to fetch subscription plans' });
  }
});

// Create a PayPal order for subscription checkout
router.post('/create-order', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'You must be logged in to subscribe' });
  }

  try {
    const data = createOrderSchema.parse(req.body);
    
    const order = await PayPalService.createOrder(data.planName, req.user.id);
    
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    
    return res.status(500).json({ message: error.message || 'Failed to create order' });
  }
});

// Capture a PayPal order after approval
router.post('/capture-order', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'You must be logged in to complete subscription' });
  }

  try {
    const { orderId, planName } = req.body;
    
    if (!orderId || !planName) {
      return res.status(400).json({ message: 'Missing orderId or planName' });
    }
    
    const result = await PayPalService.captureOrder(orderId, req.user.id, planName);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error capturing order:', error);
    return res.status(500).json({ message: error.message || 'Failed to capture order' });
  }
});

// Cancel a subscription
router.post('/cancel', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'You must be logged in to cancel a subscription' });
  }

  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ message: 'Missing subscriptionId' });
    }
    
    const result = await PayPalService.cancelSubscription(subscriptionId, req.user.id);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ message: error.message || 'Failed to cancel subscription' });
  }
});

// Get current subscription status
router.get('/current', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'You must be logged in to view subscription status' });
  }

  try {
    const subscription = await PayPalService.getActiveSubscription(req.user.id);
    
    return res.status(200).json({
      active: !!subscription,
      subscription: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
});

// Get subscription history
router.get('/history', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'You must be logged in to view subscription history' });
  }

  try {
    const history = await PayPalService.getSubscriptionHistory(req.user.id);
    
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return res.status(500).json({ message: 'Failed to fetch subscription history' });
  }
});

export default router;