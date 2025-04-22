import express from "express";
import { db } from "../db";
import { systemSettings } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

// Schema for validating PayPal settings
const paypalSettingsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  mode: z.enum(["sandbox", "live"], {
    required_error: "Mode is required",
  }),
  callbackUrl: z.string().url("Must be a valid URL").optional(),
});

// Middleware to ensure only admins can access these endpoints
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized. Admin access required." });
  }
}

// Get current PayPal settings
router.get("/admin/paypal-settings", requireAdmin, async (req, res) => {
  try {
    // Get settings from database
    const paypalClientId = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_client_id"))
      .then(rows => rows[0]?.value || "");
    
    const paypalClientSecret = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_client_secret"))
      .then(rows => rows[0]?.value || "");
    
    const paypalMode = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_mode"))
      .then(rows => rows[0]?.value || "sandbox");
    
    const paypalCallbackUrl = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "paypal_callback_url"))
      .then(rows => rows[0]?.value || "");
    
    res.json({
      clientId: paypalClientId,
      clientSecret: paypalClientSecret,
      mode: paypalMode,
      callbackUrl: paypalCallbackUrl,
    });
  } catch (error) {
    console.error("Error retrieving PayPal settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update PayPal settings
router.post("/admin/paypal-settings", requireAdmin, async (req, res) => {
  try {
    // Validate input
    const validatedData = paypalSettingsSchema.parse(req.body);
    
    // Update client ID setting
    await db.insert(systemSettings)
      .values({
        key: "paypal_client_id",
        value: validatedData.clientId,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: validatedData.clientId }
      });
    
    // Update client secret setting
    await db.insert(systemSettings)
      .values({
        key: "paypal_client_secret",
        value: validatedData.clientSecret,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: validatedData.clientSecret }
      });
    
    // Update mode setting
    await db.insert(systemSettings)
      .values({
        key: "paypal_mode",
        value: validatedData.mode,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: validatedData.mode }
      });
    
    // Update callback URL setting (if provided)
    if (validatedData.callbackUrl) {
      await db.insert(systemSettings)
        .values({
          key: "paypal_callback_url",
          value: validatedData.callbackUrl,
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: validatedData.callbackUrl }
        });
    }
    
    // Set environment variables for immediate use
    process.env.PAYPAL_CLIENT_ID = validatedData.clientId;
    process.env.PAYPAL_CLIENT_SECRET = validatedData.clientSecret;
    
    res.status(200).json({ 
      success: true, 
      message: "PayPal settings updated successfully" 
    });
  } catch (error) {
    console.error("Error updating PayPal settings:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Get PayPal transaction history
router.get("/admin/paypal-transactions", requireAdmin, async (req, res) => {
  try {
    // Get recent transactions from payments table
    const transactions = await db.query.payments.findMany({
      with: {
        user: true,
        subscription: {
          with: {
            plan: true
          }
        }
      },
      where: eq(payments.paymentMethod, "paypal"),
      orderBy: (payments, { desc }) => [desc(payments.paymentDate)]
    });
    
    // Format transaction data for frontend
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      username: transaction.user.username,
      amount: transaction.amount,
      status: transaction.status,
      date: transaction.paymentDate,
      planName: transaction.subscription?.plan.displayName || "Unknown",
      paymentId: transaction.paymentId
    }));
    
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error retrieving PayPal transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;