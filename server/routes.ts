import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateAIResponse, analyzeSentiment, generateWeeklySummary, generateCustomPrompts, storeEmbedding } from "./openai";

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
  
  // Get a single journal entry by ID
  app.get("/api/journal-entries/entry/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = Number(req.params.id);
    
    try {
      const entry = await storage.getJournalEntryById(id);
      
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      
      // Check if the entry belongs to the authenticated user
      if (entry.userId !== req.user?.id) {
        return res.sendStatus(403);
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ error: "Failed to fetch journal entry" });
    }
  });
  
  // Save Chat Transcript - collects all chat messages and saves them as a single journal entry
  app.post("/api/journal-entries/save-chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId } = req.body;
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      // Get recent chat entries that aren't already part of a saved journal
      const recentEntries = await storage.getRecentJournalEntriesByUserId(userId, 50);
      const chatEntries = recentEntries.filter(entry => !entry.isJournal);
      
      if (chatEntries.length === 0) {
        return res.status(400).json({ error: "No chat entries to save" });
      }
      
      // Combine all entries into a transcript
      const transcript = chatEntries
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(entry => `${entry.isAiResponse ? 'Hope Log: ' : 'You: '}${entry.content}`)
        .join('\n\n');
      
      // Generate summary and analyze sentiment with goal extraction
      const sentiment = await analyzeSentiment(transcript);
      
      // Create the journal entry as a permanent record (isJournal=true)
      const journalEntry = await storage.createJournalEntry({
        userId,
        content: chatEntries[chatEntries.length - 1].content, // Use the last message as the content
        date: new Date().toISOString(),
        isAiResponse: false,
        isJournal: true,
        transcript: transcript // Store the full conversation transcript
      });
      
      // Update with sentiment analysis
      const updatedEntry = await storage.updateJournalEntrySentiment(
        journalEntry.id, 
        sentiment
      );
      
      // Extract and process any goals
      if (sentiment.goals && sentiment.goals.length > 0) {
        for (const goal of sentiment.goals) {
          if (goal.isNew) {
            // Create a new goal
            await storage.createGoal({
              userId,
              name: goal.name,
              target: 100, // Default target
              progress: 0,
              unit: "%",
              colorScheme: 1
            });
          } else if (goal.completion !== undefined) {
            // Find the existing goal to update
            const existingGoals = await storage.getGoalsByUserId(userId);
            const matchingGoal = existingGoals.find(g => 
              g.name.toLowerCase() === goal.name.toLowerCase()
            );
            
            if (matchingGoal) {
              // Update the goal progress
              await storage.updateGoalProgress(matchingGoal.id, goal.completion);
            }
          }
        }
      }
      
      // Store embedding for RAG
      await storeEmbedding(journalEntry.id, transcript);
      
      // Delete individual chat entries to clear the chat
      // This is necessary to avoid storing individual messages as separate journal entries
      for (const entry of chatEntries) {
        await storage.deleteJournalEntry(entry.id);
      }
      
      res.status(201).json(updatedEntry);
    } catch (error) {
      console.error("Error saving chat transcript:", error);
      res.status(500).json({ error: "Failed to save chat transcript" });
    }
  });

  // Endpoint for getting AI chat responses without saving to DB
  app.post("/api/chat-response", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { content, userId, history = [] } = req.body;
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      // Generate AI response with RAG and include saved journal context
      const aiResponse = await generateAIResponse(content, history, req.user.username, userId);
      
      // Return only the AI response
      res.status(200).json({ content: aiResponse });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/journal-entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { content, userId, transcript = null } = req.body;
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      // This endpoint now only handles direct journal entries
      // Chat messages are handled in memory and only saved when "Save Chat" is clicked
      
      // Save as permanent journal entry
      const journalEntry = await storage.createJournalEntry({
        userId,
        content,
        date: new Date().toISOString(),
        isAiResponse: false,
        isJournal: true, // This is a permanent journal entry
        transcript: transcript || content // Use provided transcript if available, otherwise use content
      });
      
      // Get sentiment analysis
      const sentiment = await analyzeSentiment(content);
      await storage.updateJournalEntrySentiment(journalEntry.id, sentiment);
      
      // Process any goals from the journal entry
      if (sentiment.goals && sentiment.goals.length > 0) {
        for (const goal of sentiment.goals) {
          if (goal.isNew) {
            // Create a new goal
            await storage.createGoal({
              userId,
              name: goal.name,
              target: 100, // Default target
              progress: 0,
              unit: "%",
              colorScheme: 1
            });
          } else if (goal.completion !== undefined) {
            // Find the existing goal to update
            const existingGoals = await storage.getGoalsByUserId(userId);
            const matchingGoal = existingGoals.find(g => 
              g.name.toLowerCase() === goal.name.toLowerCase()
            );
            
            if (matchingGoal) {
              // Update the goal progress
              await storage.updateGoalProgress(matchingGoal.id, goal.completion);
            }
          }
        }
      }
      
      // Store embedding for RAG functionality
      try {
        await storeEmbedding(journalEntry.id, content);
      } catch (embeddingError) {
        console.error("Failed to store embedding, but continuing:", embeddingError);
      }
      
      // Return the journal entry
      res.status(201).json([journalEntry]);
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
        
        // Convert journal entries to the format expected by generateWeeklySummary
        const formattedEntries = lastWeekEntries.map(entry => ({
          content: entry.content,
          sentiment: entry.sentiment || undefined
        }));
        
        const weeklySummary = await generateWeeklySummary(formattedEntries);
        
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
