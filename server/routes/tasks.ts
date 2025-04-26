import { Router } from 'express';
import { z } from 'zod';
import { insertTaskSchema } from '@shared/schema';
import { storage } from '../storage';
import { Express } from 'express';

// Setup function that will be called from main routes.ts
export function setupTaskRoutes(app: Express) {
  const router = Router();

  // Get all tasks for a user
  router.get('/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getTasksByUserId(userId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get tasks for a specific goal
  router.get('/goal/:goalId', async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const tasks = await storage.getTasksByGoalId(goalId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks for goal:', error);
      res.status(500).json({ error: 'Failed to fetch tasks for this goal' });
    }
  });

  // Get a specific task by ID
  router.get('/single/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTaskById(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Create a new task
  router.post('/', async (req, res) => {
    try {
      // Validate request body
      const taskData = insertTaskSchema.parse(req.body);
      
      // Create the task
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update a task
  router.patch('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTaskById(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // If task is being marked as completed, set completedAt to now
      if (req.body.completed === true && !task.completed) {
        req.body.completedAt = new Date().toISOString();
      }
      
      // If task is being marked as not completed, clear completedAt
      if (req.body.completed === false && task.completed) {
        req.body.completedAt = null;
      }
      
      const updatedTask = await storage.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  router.delete('/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Register the router with the app
  app.use('/api/tasks', router);
}