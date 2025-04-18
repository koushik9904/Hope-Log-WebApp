import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, analyzeSentiment, generateWeeklySummary, generateCustomPrompts } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Journal Entries API
  app.get("/api/journal-entries/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const entries = await storage.getJournalEntriesByUserId(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { content, userId } = req.body;
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      // Save user's journal entry
      const userEntry = await storage.createJournalEntry({
        userId,
        content,
        date: new Date().toISOString(),
        isAiResponse: false
      });
      
      // Get sentiment analysis
      const sentiment = await analyzeSentiment(content);
      await storage.updateJournalEntrySentiment(userEntry.id, sentiment);
      
      // Get recent conversation history
      const recentEntries = await storage.getRecentJournalEntriesByUserId(userId, 10);
      const conversationHistory = recentEntries.map(entry => ({
        role: entry.isAiResponse ? "ai" : "user",
        content: entry.content
      }));
      
      // Generate AI response
      const aiResponse = await generateAIResponse(content, conversationHistory, req.user.username);
      
      // Save AI response
      const aiEntry = await storage.createJournalEntry({
        userId,
        content: aiResponse,
        date: new Date().toISOString(),
        isAiResponse: true
      });
      
      // Return both entries
      res.status(201).json([userEntry, aiEntry]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process journal entry" });
    }
  });

  // Moods API
  app.get("/api/moods/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const moods = await storage.getMoodsByUserId(userId);
      res.json(moods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch moods" });
    }
  });

  app.post("/api/moods", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, rating, date } = req.body;
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const mood = await storage.createMood({
        userId,
        rating,
        date
      });
      res.status(201).json(mood);
    } catch (error) {
      res.status(500).json({ error: "Failed to record mood" });
    }
  });

  // Goals API
  app.get("/api/goals/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const goals = await storage.getGoalsByUserId(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, name, target, unit, colorScheme } = req.body;
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const goal = await storage.createGoal({
        userId,
        name,
        target,
        progress: 0,
        unit,
        colorScheme
      });
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:goalId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const goalId = Number(req.params.goalId);
    const { progress } = req.body;
    
    try {
      const goal = await storage.getGoalById(goalId);
      if (!goal) return res.status(404).json({ error: "Goal not found" });
      if (goal.userId !== req.user?.id) return res.sendStatus(403);
      
      const updatedGoal = await storage.updateGoalProgress(goalId, progress);
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // Prompts API
  app.get("/api/prompts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get some starter prompts if user has no history yet
      let prompts = await storage.getDefaultPrompts();
      
      // If user has journal history, generate custom prompts
      const recentEntries = await storage.getRecentJournalEntriesByUserId(req.user.id, 5);
      if (recentEntries.length > 0) {
        const userEntries = recentEntries
          .filter(entry => !entry.isAiResponse)
          .map(entry => entry.content);
        
        const recentMoods = await storage.getRecentMoodsByUserId(req.user.id, 7);
        const moodRatings = recentMoods.map(mood => mood.rating);
        
        if (userEntries.length > 0) {
          const customPromptTexts = await generateCustomPrompts(userEntries, moodRatings);
          
          // Create custom prompts in storage
          const customPrompts = [];
          for (const text of customPromptTexts) {
            const prompt = await storage.createPrompt({
              text,
              category: "custom"
            });
            customPrompts.push(prompt);
          }
          
          // Use custom prompts if available, otherwise fall back to defaults
          if (customPrompts.length > 0) {
            prompts = customPrompts;
          }
        }
      }
      
      res.json(prompts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  // Weekly summary API
  app.get("/api/summary/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      // Get existing summary if available
      let summary = await storage.getSummaryByUserId(userId);
      
      // If no summary exists or it's older than a day, generate a new one
      if (!summary || new Date(summary.updatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        const lastWeekEntries = await storage.getJournalEntriesForLastWeek(userId);
        
        if (lastWeekEntries.length === 0) {
          return res.status(404).json({ error: "Not enough journal entries to generate a summary" });
        }
        
        const weeklySummary = await generateWeeklySummary(lastWeekEntries);
        
        summary = await storage.createOrUpdateSummary({
          userId,
          topEmotions: weeklySummary.topEmotions,
          commonThemes: weeklySummary.commonThemes,
          insights: weeklySummary.insights,
          updatedAt: new Date().toISOString()
        });
      }
      
      res.json(summary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Export journal entries (PDF not implemented in MVP)
  app.get("/api/export/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const entries = await storage.getJournalEntriesByUserId(userId);
      
      // For MVP, just return JSON
      res.json({
        username: req.user.username,
        exportDate: new Date().toISOString(),
        entries: entries
      });
      
      // TODO: Add PDF generation in future versions
    } catch (error) {
      res.status(500).json({ error: "Failed to export journal entries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
