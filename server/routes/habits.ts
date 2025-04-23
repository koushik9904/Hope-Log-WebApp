import { Express } from "express";
import { storage } from "../storage";
import { insertHabitSchema } from "@shared/schema";
import { z } from "zod";

export function setupHabitRoutes(app: Express) {
  // Get all habits for a user
  app.get("/api/habits/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const habits = await storage.getHabitsByUserId(userId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });
  
  // Create a new habit
  app.post("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const habitData = insertHabitSchema.parse(req.body);
      
      // Ensure the user is creating a habit for themselves
      if (req.user?.id !== habitData.userId) {
        return res.status(403).json({ error: "You don't have permission to create habits for other users" });
      }
      
      const habit = await storage.createHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid habit data", details: error.errors });
      }
      console.error("Error creating habit:", error);
      res.status(500).json({ error: "Failed to create habit" });
    }
  });
  
  // Get a single habit by ID
  app.get("/api/habits/habit/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = Number(req.params.id);
    
    try {
      const habit = await storage.getHabitById(habitId);
      
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      
      // Ensure the habit belongs to the authenticated user
      if (habit.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to view this habit" });
      }
      
      res.json(habit);
    } catch (error) {
      console.error("Error fetching habit:", error);
      res.status(500).json({ error: "Failed to fetch habit" });
    }
  });
  
  // Update a habit
  app.patch("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = Number(req.params.id);
    
    try {
      // Get the habit to verify ownership
      const habit = await storage.getHabitById(habitId);
      
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      
      // Ensure the habit belongs to the authenticated user
      if (habit.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to update this habit" });
      }
      
      // Update the habit
      const updatedHabit = await storage.updateHabit(habitId, req.body);
      res.json(updatedHabit);
    } catch (error) {
      console.error("Error updating habit:", error);
      res.status(500).json({ error: "Failed to update habit" });
    }
  });
  
  // Toggle habit completion
  app.patch("/api/habits/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = Number(req.params.id);
    const { completed } = req.body;
    
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "The 'completed' field must be a boolean" });
    }
    
    try {
      // Get the habit to verify ownership
      const habit = await storage.getHabitById(habitId);
      
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      
      // Ensure the habit belongs to the authenticated user
      if (habit.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to update this habit" });
      }
      
      // Toggle the habit completion
      const updatedHabit = await storage.toggleHabitCompletion(habitId, completed);
      res.json(updatedHabit);
    } catch (error) {
      console.error("Error toggling habit completion:", error);
      res.status(500).json({ error: "Failed to toggle habit completion" });
    }
  });
  
  // Delete a habit (soft delete - moves to recycle bin)
  app.delete("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = Number(req.params.id);
    
    try {
      // Get the habit to verify ownership
      const habit = await storage.getHabitById(habitId);
      
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      
      // Ensure the habit belongs to the authenticated user
      if (habit.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to delete this habit" });
      }
      
      // Soft delete the habit
      await storage.deleteHabit(habitId);
      res.status(200).json({ message: "Habit deleted successfully" });
    } catch (error) {
      console.error("Error deleting habit:", error);
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });
  
  // Get deleted habits (recycle bin)
  app.get("/api/habits/:userId/deleted", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const habits = await storage.getDeletedHabitsByUserId(userId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching deleted habits:", error);
      res.status(500).json({ error: "Failed to fetch deleted habits" });
    }
  });
  
  // Restore habit from recycle bin
  app.post("/api/habits/:id/restore", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = Number(req.params.id);
    
    try {
      // Get the habit to verify ownership
      const habit = await storage.getHabitById(habitId);
      
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      
      // Ensure the habit belongs to the authenticated user
      if (habit.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to restore this habit" });
      }
      
      // Restore the habit
      const restoredHabit = await storage.restoreHabit(habitId);
      res.json(restoredHabit);
    } catch (error) {
      console.error("Error restoring habit:", error);
      res.status(500).json({ error: "Failed to restore habit" });
    }
  });
  
  // Permanently delete habit from recycle bin
  app.delete("/api/habits/:id/permanent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const habitId = Number(req.params.id);
    
    try {
      // Get the habit to verify ownership
      const habit = await storage.getHabitById(habitId);
      
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      
      // Ensure the habit belongs to the authenticated user
      if (habit.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to permanently delete this habit" });
      }
      
      // Permanently delete the habit
      await storage.permanentlyDeleteHabit(habitId);
      res.status(200).json({ message: "Habit permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting habit:", error);
      res.status(500).json({ error: "Failed to permanently delete habit" });
    }
  });
}