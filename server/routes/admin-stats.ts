import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

// Get admin dashboard statistics
router.get("/stats", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    // In a real implementation, these would come from actual database queries
    // For now, we'll use mock data
    
    // Mock getting a count of users
    let users = [];
    try {
      users = await storage.getAllUsers();
    } catch (err) {
      console.error("Error fetching users:", err);
    }
    const totalUsers = users.length;
    
    // Count of active sessions (we'd normally get this from the session store)
    const activeSessions = req.sessionStore.all ? 
      await new Promise((resolve) => {
        req.sessionStore.all((err, sessions) => {
          resolve(sessions ? Object.keys(sessions).length : 0);
        });
      }) : 2;
    
    // Count of journal entries
    const allEntries = [];
    for (const user of users) {
      try {
        const userEntries = await storage.getJournalEntriesByUserId(user.id);
        allEntries.push(...userEntries);
      } catch (err) {
        console.error("Error fetching journal entries:", err);
      }
    }
    const totalJournalEntries = allEntries.length;
    
    // AI interactions count (this would normally be tracked separately)
    // For now, we'll estimate based on journal entries
    const totalAiInteractions = totalJournalEntries * 3; // Estimate 3 interactions per entry
    
    return res.json({
      totalUsers,
      activeSessions,
      totalJournalEntries,
      totalAiInteractions,
      databaseStatus: "online",
      systemAlerts: [],
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

export default router;