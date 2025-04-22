import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

// Schema for validating OpenAI settings updates
const updateOpenAISchema = z.object({
  openAiApiKey: z.string().min(10, "OpenAI API Key is too short").optional(),
  enableTokenLimit: z.boolean().default(true),
  monthlyTokenLimit: z.number().int().min(0, "Token limit must be a positive number").default(100000),
});

interface OpenAIUsage {
  userId: number;
  username: string;
  tokensUsed: number;
  lastUsed: string;
}

// This would normally come from a database, but we'll mock it for now
const mockUserTokenUsage: OpenAIUsage[] = [
  { userId: 1, username: "james_parker", tokensUsed: 34500, lastUsed: "2025-04-18T15:32:00Z" },
  { userId: 2, username: "emilywrites", tokensUsed: 29800, lastUsed: "2025-04-20T09:17:00Z" },
  { userId: 3, username: "admin", tokensUsed: 5200, lastUsed: "2025-04-21T11:45:00Z" },
  { userId: 4, username: "journaluser", tokensUsed: 18600, lastUsed: "2025-04-19T22:30:00Z" },
  { userId: 5, username: "mindfulme", tokensUsed: 42100, lastUsed: "2025-04-21T16:12:00Z" },
];

// Get OpenAI settings status
router.get("/openai-status", (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const openAiApiKeyConfigured = !!process.env.OPENAI_API_KEY;
  const enableTokenLimit = true; // This would normally come from a database
  const monthlyTokenLimit = 100000; // This would normally come from a database
  const totalTokensUsed = mockUserTokenUsage.reduce((sum, user) => sum + user.tokensUsed, 0);
  
  return res.json({
    openAiApiKeyConfigured,
    enableTokenLimit,
    monthlyTokenLimit,
    totalTokensUsed
  });
});

// Get token usage data
router.get("/token-usage", (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  return res.json({
    userUsage: mockUserTokenUsage,
    totalUsage: mockUserTokenUsage.reduce((sum, user) => sum + user.tokensUsed, 0)
  });
});

// Update OpenAI settings
router.post("/update-openai", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    // Validate input data
    const data = updateOpenAISchema.parse(req.body);
    
    // This would normally update environment variables or database settings
    console.log("OpenAI settings update requested:");
    console.log("- Enable Token Limit:", data.enableTokenLimit);
    console.log("- Monthly Token Limit:", data.monthlyTokenLimit);
    
    if (data.openAiApiKey) {
      console.log("- New OpenAI API Key provided (hidden for security)");
      // In a real implementation, we'd update the actual environment variable or settings store
      process.env.OPENAI_API_KEY = data.openAiApiKey;
    }
    
    return res.json({ 
      success: true, 
      message: "OpenAI settings updated successfully" 
    });
  } catch (error) {
    console.error("Error updating OpenAI settings:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    return res.status(500).json({ error: "Failed to update OpenAI settings" });
  }
});

export default router;