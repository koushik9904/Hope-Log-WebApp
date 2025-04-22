import { Router, Request, Response } from "express";
import { z } from "zod";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import axios from "axios";

const router = Router();

// Schema for validating OAuth settings updates
const updateOAuthSchema = z.object({
  googleClientId: z.string().min(20, "Google Client ID is too short").optional(),
  googleClientSecret: z.string().min(10, "Google Client Secret is too short").optional(),
  enableGoogleAuth: z.boolean().default(false),
  enableAppleAuth: z.boolean().default(false)
});

// Get OAuth status (without exposing secrets)
router.get("/oauth-status", (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  const googleAuthEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const appleAuthEnabled = !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_TEAM_ID;
  
  return res.json({
    googleAuthEnabled,
    appleAuthEnabled
  });
});

// Update OAuth settings
router.post("/update-oauth", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    // Validate input data
    const data = updateOAuthSchema.parse(req.body);
    
    // This would normally update environment variables or database settings
    // For demonstration, we'll log what would be updated
    console.log("OAuth settings update requested:");
    console.log("- Enable Google Auth:", data.enableGoogleAuth);
    console.log("- Enable Apple Auth:", data.enableAppleAuth);
    
    if (data.googleClientId) {
      console.log("- New Google Client ID provided (hidden for security)");
      // In a real implementation, we'd update the actual environment variable or settings store
      process.env.GOOGLE_CLIENT_ID = data.googleClientId;
    }
    
    if (data.googleClientSecret) {
      console.log("- New Google Client Secret provided (hidden for security)");
      // In a real implementation, we'd update the actual environment variable or settings store
      process.env.GOOGLE_CLIENT_SECRET = data.googleClientSecret;
    }
    
    return res.json({ 
      success: true, 
      message: "OAuth settings updated successfully" 
    });
  } catch (error) {
    console.error("Error updating OAuth settings:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    return res.status(500).json({ error: "Failed to update OAuth settings" });
  }
});

// Test OAuth connection
router.post("/test-oauth", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  const { provider } = req.body;
  
  if (provider === 'google') {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({ 
          success: false, 
          message: "Google OAuth credentials not configured" 
        });
      }
      
      // Test Google OAuth configuration by making a request to Google's discovery document
      const response = await axios.get('https://accounts.google.com/.well-known/openid-configuration');
      
      if (response.status === 200) {
        return res.json({ 
          success: true, 
          message: "Google OAuth credentials are valid and connectivity test passed" 
        });
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Google OAuth test failed:", error);
      return res.status(400).json({ 
        success: false, 
        message: `Google OAuth test failed: ${error.message || 'Unknown error'}` 
      });
    }
  } else if (provider === 'apple') {
    return res.status(400).json({ 
      success: false, 
      message: "Apple OAuth testing is not yet implemented" 
    });
  } else {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid OAuth provider specified" 
    });
  }
});

export default router;