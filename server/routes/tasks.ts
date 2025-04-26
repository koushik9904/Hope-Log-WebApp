import { Express } from "express";
import { storage } from "../storage";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";

export function setupTaskRoutes(app: Express) {
  // Get all tasks for a user
  app.get("/api/tasks/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const tasks = await storage.getTasksByUserId(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  
  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const taskData = insertTaskSchema.parse(req.body);
      
      // Ensure the user is creating a task for themselves
      if (req.user?.id !== taskData.userId) {
        return res.status(403).json({ error: "You don't have permission to create tasks for other users" });
      }
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });
  
  // Get a single task by ID
  app.get("/api/tasks/task/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = Number(req.params.id);
    
    try {
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Ensure the task belongs to the authenticated user
      if (task.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to view this task" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });
  
  // Update a task
  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = Number(req.params.id);
    
    try {
      // Get the task to verify ownership
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Ensure the task belongs to the authenticated user
      if (task.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to update this task" });
      }
      
      // Update the task
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });
  
  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = Number(req.params.id);
    
    try {
      // Get the task to verify ownership
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Ensure the task belongs to the authenticated user
      if (task.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to delete this task" });
      }
      
      // Delete the task
      await storage.deleteTask(taskId);
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });
  
  // Get completed tasks for a user
  app.get("/api/tasks/:userId/completed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = Number(req.params.userId);
    if (req.user?.id !== userId) return res.sendStatus(403);
    
    try {
      const tasks = await storage.getCompletedTasksByUserId(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      res.status(500).json({ error: "Failed to fetch completed tasks" });
    }
  });
  
  // Get tasks for a specific goal
  app.get("/api/tasks/goal/:goalId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const goalId = Number(req.params.goalId);
    
    try {
      // Get the goal to verify ownership
      const goal = await storage.getGoalById(goalId);
      
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      // Ensure the goal belongs to the authenticated user
      if (goal.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to view tasks for this goal" });
      }
      
      const tasks = await storage.getTasksByGoalId(goalId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks for goal:", error);
      res.status(500).json({ error: "Failed to fetch tasks for goal" });
    }
  });
}