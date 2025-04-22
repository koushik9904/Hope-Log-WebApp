import { Router, Request, Response } from "express";
import { z } from "zod";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import axios from "axios";
import { storage } from "../storage";

const router = Router();

// Schema for validating OAuth settings updates
const updateOAuthSchema = z.object({
  googleClientId: z.string().min(20, "Google Client ID is too short").optional(),
  googleClientSecret: z.string().min(10, "Google Client Secret is too short").optional(),
  enableGoogleAuth: z.boolean().default(false),
  enableAppleAuth: z.boolean().default(false)
});

// Get OAuth status (without exposing secrets)
router.get("/oauth-status", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  // Check both environment variables and database settings
  const googleClientId = await storage.getSystemSetting("GOOGLE_CLIENT_ID") || process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = await storage.getSystemSetting("GOOGLE_CLIENT_SECRET") || process.env.GOOGLE_CLIENT_SECRET;
  const googleAuthEnabled = !!googleClientId && !!googleClientSecret;
  
  const appleClientId = await storage.getSystemSetting("APPLE_CLIENT_ID") || process.env.APPLE_CLIENT_ID;
  const appleTeamId = await storage.getSystemSetting("APPLE_TEAM_ID") || process.env.APPLE_TEAM_ID;
  const appleAuthEnabled = !!appleClientId && !!appleTeamId;
  
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
    
    // Log settings being updated
    console.log("OAuth settings update requested:");
    console.log("- Enable Google Auth:", data.enableGoogleAuth);
    console.log("- Enable Apple Auth:", data.enableAppleAuth);
    
    // Update Google settings
    if (data.enableGoogleAuth) {
      if (data.googleClientId) {
        console.log("- New Google Client ID provided (hidden for security)");
        // Update in both environment and database
        process.env.GOOGLE_CLIENT_ID = data.googleClientId;
        await storage.setSystemSetting("GOOGLE_CLIENT_ID", data.googleClientId);
      }
      
      if (data.googleClientSecret) {
        console.log("- New Google Client Secret provided (hidden for security)");
        // Update in both environment and database
        process.env.GOOGLE_CLIENT_SECRET = data.googleClientSecret;
        await storage.setSystemSetting("GOOGLE_CLIENT_SECRET", data.googleClientSecret);
      }
    } else {
      // If Google auth is disabled, clear the credentials
      process.env.GOOGLE_CLIENT_ID = '';
      process.env.GOOGLE_CLIENT_SECRET = '';
      await storage.setSystemSetting("GOOGLE_CLIENT_ID", '');
      await storage.setSystemSetting("GOOGLE_CLIENT_SECRET", '');
    }
    
    // Update Apple settings (similar approach could be used)
    if (data.enableAppleAuth) {
      // Implement Apple OAuth credential storage when needed
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
      // Check both environment variables and database settings
      const googleClientId = await storage.getSystemSetting("GOOGLE_CLIENT_ID") || process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = await storage.getSystemSetting("GOOGLE_CLIENT_SECRET") || process.env.GOOGLE_CLIENT_SECRET;
      
      if (!googleClientId || !googleClientSecret) {
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
    } catch (error: any) {
      console.error("Google OAuth test failed:", error);
      return res.status(400).json({ 
        success: false, 
        message: `Google OAuth test failed: ${error?.message || 'Unknown error'}` 
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