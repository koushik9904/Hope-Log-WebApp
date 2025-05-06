import { 
  User, InsertUser, 
  JournalEntry, InsertJournalEntry, 
  Mood, InsertMood, 
  Goal, InsertGoal, 
  Task, InsertTask,
  Habit, InsertHabit,
  Prompt, InsertPrompt, 
  Summary, InsertSummary, 
  Notification, InsertNotification,
  NotificationPreferences, InsertNotificationPreferences,
  SystemSettings, InsertSystemSettings,
  AISuggestedGoal, InsertAiGoal,
  AISuggestedTask, InsertAiTask,
  AISuggestedHabit, InsertAiHabit,
  users, journalEntries, moods, goals, tasks, habits, prompts, summaries,
  notifications, notificationPreferences, systemSettings,
  aiGoals, aiTasks, aiHabits
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, gte, desc, sql, isNull, not } from "drizzle-orm";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

// Interfaces for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  verifyUser(id: number): Promise<User>;
  resetPassword(email: string, newPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // System settings methods
  getSystemSetting(key: string): Promise<string | null>;
  setSystemSetting(key: string, value: string): Promise<void>;
  
  // Journal methods
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;
  getRecentJournalEntriesByUserId(userId: number, limit: number): Promise<JournalEntry[]>;
  getJournalEntriesForLastWeek(userId: number): Promise<JournalEntry[]>;
  getUnanalyzedJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry>;
  updateJournalEntrySentiment(id: number, sentiment: { score: number; emotions: string[]; themes: string[] }): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<void>;
  getDeletedJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  restoreJournalEntry(id: number): Promise<JournalEntry>;
  permanentlyDeleteJournalEntry(id: number): Promise<void>;
  
  // Mood methods
  getMoodsByUserId(userId: number): Promise<Mood[]>;
  getRecentMoodsByUserId(userId: number, limit: number): Promise<Mood[]>;
  createMood(mood: InsertMood): Promise<Mood>;
  
  // Goal methods
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  getGoalById(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoalProgress(id: number, progress: number): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  getAISuggestedGoals(userId: number): Promise<Goal[]>; // Legacy method
  updateGoalStatus(id: number, status: string): Promise<Goal>;
  
  // AI Goal methods
  getAiGoalsByUserId(userId: number): Promise<AISuggestedGoal[]>;
  getAiGoalById(id: number): Promise<AISuggestedGoal | undefined>;
  createAiGoal(goal: InsertAiGoal): Promise<AISuggestedGoal>;
  deleteAiGoal(id: number): Promise<void>;
  acceptAiGoal(id: number): Promise<Goal>; // Moves from AI table to main table
  
  // Task methods
  getTasksByUserId(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getCompletedTasksByUserId(userId: number): Promise<Task[]>;
  getTasksByGoalId(goalId: number): Promise<Task[]>;
  getAISuggestedTasks(userId: number): Promise<Task[]>; // Legacy method
  
  // AI Task methods
  getAiTasksByUserId(userId: number): Promise<AISuggestedTask[]>;
  getAiTaskById(id: number): Promise<AISuggestedTask | undefined>;
  createAiTask(task: InsertAiTask): Promise<AISuggestedTask>;
  deleteAiTask(id: number): Promise<void>;
  acceptAiTask(id: number): Promise<Task>; // Moves from AI table to main table
  
  // Habit methods
  getHabitsByUserId(userId: number): Promise<Habit[]>;
  getHabitById(id: number): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habit: Partial<Habit>): Promise<Habit>;
  toggleHabitCompletion(id: number, completed: boolean): Promise<Habit>;
  deleteHabit(id: number): Promise<void>;
  getDeletedHabitsByUserId(userId: number): Promise<Habit[]>;
  restoreHabit(id: number): Promise<Habit>;
  permanentlyDeleteHabit(id: number): Promise<void>;
  getAISuggestedHabits(userId: number): Promise<Habit[]>; // Legacy method
  
  // AI Habit methods
  getAiHabitsByUserId(userId: number): Promise<AISuggestedHabit[]>;
  getAiHabitById(id: number): Promise<AISuggestedHabit | undefined>;
  createAiHabit(habit: InsertAiHabit): Promise<AISuggestedHabit>;
  deleteAiHabit(id: number): Promise<void>;
  acceptAiHabit(id: number): Promise<Habit>; // Moves from AI table to main table
  
  // Prompt methods
  getDefaultPrompts(): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  
  // Summary methods
  getSummaryByUserId(userId: number): Promise<Summary | undefined>;
  createOrUpdateSummary(summary: InsertSummary): Promise<Summary>;
  
  // Notification methods
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotificationStatus(id: number, status: string): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  deleteAllNotificationsByUserId(userId: number): Promise<void>;
  
  // Notification preferences methods
  getNotificationPreferencesByUserId(userId: number): Promise<NotificationPreferences | undefined>;
  createOrUpdateNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  /**
   * Execute a raw SQL query with parameters safely
   * @param query SQL query string with $1, $2, etc. placeholders
   * @param params Array of parameter values
   * @returns Promise resolving to the query result
   */
  private async executeRawQuery(query: string, params: any[] = []): Promise<any> {
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Error executing raw query:', error);
      throw error;
    }
  }
  
  constructor() {
    // Use PostgreSQL session store for better session persistence
    const PostgresStore = connectPg(session);
    
    // Use memory store for simplicity and reliability
    console.log("Using MemoryStore for sessions - better for development");
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Setup default prompts
    this.createDefaultPrompts();
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    // First try to find by username
    const result = await db.select().from(users).where(eq(users.username, username));
    if (result.length > 0) {
      return result[0];
    }
    
    // If not found and it looks like an email, try to find by email
    if (username.includes('@')) {
      return this.getUserByEmail(username);
    }
    
    return undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    // Handle the new required 'name' field when not provided
    const userToInsert = {
      ...insertUser,
      // If name is not provided but firstName is, use firstName as name
      name: insertUser.name || insertUser.firstName || 'User',
    };
    
    const result = await db.insert(users).values(userToInsert).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async verifyUser(id: number): Promise<User> {
    const result = await db
      .update(users)
      .set({ 
        isVerified: true,
        verificationToken: null 
      })
      .where(eq(users.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        return false;
      }
      
      await db
        .update(users)
        .set({ password: newPassword })
        .where(eq(users.id, user.id));
      
      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          sql`${journalEntries.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(journalEntries.date));
  }
  
  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    const result = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id));
      
    return result[0];
  }
  
  async getRecentJournalEntriesByUserId(userId: number, limit: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          sql`${journalEntries.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(journalEntries.date))
      .limit(limit);
  }
  
  async getJournalEntriesForLastWeek(userId: number): Promise<JournalEntry[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          sql`${journalEntries.deletedAt} IS NULL`,
          gte(journalEntries.date, oneWeekAgo.toISOString())
        )
      )
      .orderBy(desc(journalEntries.date));
  }
  
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await db
      .insert(journalEntries)
      .values({
        ...entry,
        sentiment: entry.sentiment || { score: 3, emotions: [], themes: [] },
        analyzed: false // Explicitly set analyzed to false for new entries
      })
      .returning();
      
    return result[0];
  }
  
  async updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const result = await db
      .update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Journal entry with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async updateJournalEntrySentiment(
    id: number,
    sentiment: { score: number; emotions: string[]; themes: string[] }
  ): Promise<JournalEntry> {
    return this.updateJournalEntry(id, { sentiment });
  }
  
  async getUnanalyzedJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          eq(journalEntries.isJournal, true),
          eq(journalEntries.analyzed, false),
          sql`${journalEntries.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(journalEntries.date));
  }
  
  async deleteJournalEntry(id: number): Promise<void> {
    // Soft delete - set deletedAt to current date
    await db
      .update(journalEntries)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(journalEntries.id, id));
  }
  
  async getDeletedJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          // Is not null check
          sql`${journalEntries.deletedAt} IS NOT NULL`
        )
      )
      .orderBy(desc(journalEntries.date));
  }
  
  async restoreJournalEntry(id: number): Promise<JournalEntry> {
    const result = await db
      .update(journalEntries)
      .set({ deletedAt: null })
      .where(eq(journalEntries.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Journal entry with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async permanentlyDeleteJournalEntry(id: number): Promise<void> {
    await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, id));
  }
  
  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return await db
      .select()
      .from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.date));
  }
  
  async getRecentMoodsByUserId(userId: number, limit: number): Promise<Mood[]> {
    return await db
      .select()
      .from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.date))
      .limit(limit);
  }
  
  async createMood(mood: InsertMood): Promise<Mood> {
    const result = await db
      .insert(moods)
      .values(mood)
      .returning();
      
    return result[0];
  }
  
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          isNull(goals.deletedAt)
        )
      )
      .orderBy(desc(goals.id));
  }
  
  async getGoalById(id: number): Promise<Goal | undefined> {
    const result = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id));
      
    return result[0];
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await db
      .insert(goals)
      .values(goal)
      .returning();
      
    return result[0];
  }
  
  async updateGoalProgress(id: number, progress: number): Promise<Goal> {
    const result = await db
      .update(goals)
      .set({ progress })
      .where(eq(goals.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Goal with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async deleteGoal(id: number): Promise<void> {
    await db
      .update(goals)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(goals.id, id));
  }
  
  async getDeletedGoalsByUserId(userId: number): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          sql`${goals.deletedAt} IS NOT NULL`
        )
      )
      .orderBy(desc(goals.id));
  }
  
  async restoreGoal(id: number): Promise<Goal> {
    const result = await db
      .update(goals)
      .set({ deletedAt: null })
      .where(eq(goals.id, id))
      .returning();
    return result[0];
  }
  
  async getAISuggestedGoals(userId: number): Promise<Goal[]> {
    // Legacy method - redirects to getAiGoalsByUserId and converts format
    const aiGoalsResult = await this.getAiGoalsByUserId(userId);
    
    // Convert AISuggestedGoal to Goal format for backward compatibility
    return aiGoalsResult.map(aiGoal => ({
      id: aiGoal.id,
      userId: aiGoal.userId,
      name: aiGoal.name,
      description: aiGoal.description,
      category: aiGoal.category,
      startDate: null,
      targetDate: null,
      target: 100,
      progress: 0,
      unit: '%',
      colorScheme: 1,
      status: 'suggested',
      source: 'ai',
      aiExplanation: aiGoal.explanation,
      dependsOn: [],
      deletedAt: null,
      createdAt: aiGoal.createdAt,
      updatedAt: null
    }));
  }
  
  // New AI Goal methods
  async getAiGoalsByUserId(userId: number): Promise<AISuggestedGoal[]> {
    return await db
      .select()
      .from(aiGoals)
      .where(eq(aiGoals.userId, userId))
      .orderBy(desc(aiGoals.createdAt));
  }
  
  async getAiGoalById(id: number): Promise<AISuggestedGoal | undefined> {
    const result = await db
      .select()
      .from(aiGoals)
      .where(eq(aiGoals.id, id));
      
    return result[0];
  }
  
  async createAiGoal(goal: InsertAiGoal): Promise<AISuggestedGoal> {
    // Normalize the name for better duplicate checking
    const normalizedName = goal.name.toLowerCase().trim();
    
    // Check if similar goal already exists in main goals table
    const existingGoals = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, goal.userId),
          sql`LOWER(TRIM(${goals.name})) = ${normalizedName}`
        )
      );
      
    if (existingGoals.length > 0) {
      console.log(`Skipping duplicate goal: ${goal.name} (exists in main table)`);
      throw new Error(`Goal with similar name already exists`);
    }
    
    // Check if similar goal already exists in AI goals table
    const existingAiGoals = await db
      .select()
      .from(aiGoals)
      .where(
        and(
          eq(aiGoals.userId, goal.userId),
          sql`LOWER(TRIM(${aiGoals.name})) = ${normalizedName}`
        )
      );
      
    if (existingAiGoals.length > 0) {
      console.log(`Skipping duplicate goal: ${goal.name} (exists in AI table)`);
      throw new Error(`Goal suggestion with similar name already exists`);
    }
    
    // Create the AI goal if no duplicates were found
    const result = await db
      .insert(aiGoals)
      .values(goal)
      .returning();
      
    return result[0];
  }
  
  async deleteAiGoal(id: number): Promise<void> {
    await db
      .delete(aiGoals)
      .where(eq(aiGoals.id, id));
  }
  
  async acceptAiGoal(id: number): Promise<Goal> {
    // Get the AI goal
    const aiGoal = await this.getAiGoalById(id);
    if (!aiGoal) {
      throw new Error(`AI Goal with id ${id} not found`);
    }
    
    console.log(`Accepting AI Goal with id ${id}:`, aiGoal);
    
    try {
      // Create a new goal in the main goals table
      const newGoal = await this.createGoal({
        userId: aiGoal.userId,
        name: aiGoal.name,
        description: aiGoal.description || '',
        category: aiGoal.category || 'Personal',
        target: 100, // Default
        progress: 0,
        status: 'in_progress',
        source: 'ai',
        aiExplanation: aiGoal.explanation
      });
      
      console.log(`Created new goal from AI suggestion:`, newGoal);
      
      // Delete the AI goal
      await this.deleteAiGoal(id);
      console.log(`Deleted AI Goal with id ${id}`);
      
      return newGoal;
    } catch (error) {
      console.error(`Error accepting AI Goal with id ${id}:`, error);
      throw error;
    }
  }
  
  async updateGoalStatus(id: number, status: string): Promise<Goal> {
    const result = await db
      .update(goals)
      .set({ 
        status,
        // If accepting a suggested goal, update it to in_progress
        ...(status === 'accepted' ? { status: 'in_progress' } : {})
      })
      .where(eq(goals.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Goal with id ${id} not found`);
    }
    
    return result[0];
  }
  
  // Task methods
  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          isNull(tasks.deletedAt)
        )
      )
      .orderBy(desc(tasks.createdAt));
  }
  
  async getTaskById(id: number): Promise<Task | undefined> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
      
    return result[0];
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values(task)
      .returning();
      
    return result[0];
  }
  
  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task> {
    // If we're marking it completed, set the completedAt date
    if (taskUpdate.completed === true && !taskUpdate.completedAt) {
      taskUpdate.completedAt = new Date().toISOString();
    }
    
    // If we're marking it incomplete, clear the completedAt date
    if (taskUpdate.completed === false) {
      taskUpdate.completedAt = null;
    }
    
    const result = await db
      .update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async deleteTask(id: number): Promise<void> {
    // Soft delete
    await db
      .update(tasks)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(tasks.id, id));
  }
  
  async getDeletedTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          sql`${tasks.deletedAt} IS NOT NULL`
        )
      )
      .orderBy(desc(tasks.id));
  }
  
  async restoreTask(id: number): Promise<Task> {
    const result = await db
      .update(tasks)
      .set({ deletedAt: null })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }
  

  
  async getCompletedTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true),
          isNull(tasks.deletedAt)
        )
      )
      .orderBy(desc(tasks.completedAt));
  }
  
  async getTasksByGoalId(goalId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.goalId, goalId),
          isNull(tasks.deletedAt)
        )
      )
      .orderBy(desc(tasks.createdAt));
  }
  
  async getAISuggestedTasks(userId: number): Promise<Task[]> {
    // Legacy method - redirects to getAiTasksByUserId and converts format
    const aiTasksResult = await this.getAiTasksByUserId(userId);
    
    // Convert AISuggestedTask to Task format for backward compatibility
    return aiTasksResult.map(aiTask => ({
      id: aiTask.id,
      userId: aiTask.userId,
      title: aiTask.title,
      description: aiTask.description,
      dueDate: aiTask.dueDate,
      completed: false,
      completedAt: null,
      goalId: aiTask.goalId,
      priority: aiTask.priority || 'medium',
      colorScheme: 1,
      status: 'suggested',
      source: 'ai',
      aiExplanation: aiTask.explanation,
      deletedAt: null,
      createdAt: aiTask.createdAt,
      updatedAt: null
    }));
  }
  
  // New AI Task methods
  async getAiTasksByUserId(userId: number): Promise<AISuggestedTask[]> {
    return await db
      .select()
      .from(aiTasks)
      .where(eq(aiTasks.userId, userId))
      .orderBy(desc(aiTasks.createdAt));
  }
  
  async getAiTaskById(id: number): Promise<AISuggestedTask | undefined> {
    const result = await db
      .select()
      .from(aiTasks)
      .where(eq(aiTasks.id, id));
      
    return result[0];
  }
  
  async createAiTask(task: InsertAiTask): Promise<AISuggestedTask> {
    // Normalize the title for better duplicate checking
    const normalizedTitle = task.title.toLowerCase().trim();
    
    // Check if similar task already exists in main tasks table
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, task.userId),
          sql`LOWER(TRIM(${tasks.title})) = ${normalizedTitle}`,
          isNull(tasks.deletedAt)
        )
      );
      
    if (existingTasks.length > 0) {
      console.log(`Skipping duplicate task: ${task.title} (exists in main table)`);
      throw new Error(`Task with similar title already exists`);
    }
    
    // Check if similar task already exists in AI tasks table
    const existingAiTasks = await db
      .select()
      .from(aiTasks)
      .where(
        and(
          eq(aiTasks.userId, task.userId),
          sql`LOWER(TRIM(${aiTasks.title})) = ${normalizedTitle}`
        )
      );
      
    if (existingAiTasks.length > 0) {
      console.log(`Skipping duplicate task: ${task.title} (exists in AI table)`);
      throw new Error(`Task suggestion with similar title already exists`);
    }
    
    // Create the AI task if no duplicates were found
    const result = await db
      .insert(aiTasks)
      .values(task)
      .returning();
      
    return result[0];
  }
  
  async deleteAiTask(id: number): Promise<void> {
    await db
      .delete(aiTasks)
      .where(eq(aiTasks.id, id));
  }
  
  async acceptAiTask(id: number): Promise<Task> {
    // Get the AI task
    const aiTask = await this.getAiTaskById(id);
    if (!aiTask) {
      throw new Error(`AI Task with id ${id} not found`);
    }
    
    console.log(`Accepting AI Task with id ${id}:`, aiTask);
    
    try {
      // Create a new task in the main tasks table
      const newTask = await this.createTask({
        userId: aiTask.userId,
        title: aiTask.title,
        description: aiTask.description || '',
        priority: aiTask.priority || 'medium',
        goalId: aiTask.goalId,
        dueDate: aiTask.dueDate,
        status: 'pending',
        source: 'ai',
        aiExplanation: aiTask.explanation
      });
      
      console.log(`Created new task from AI suggestion:`, newTask);
      
      // Delete the AI task
      await this.deleteAiTask(id);
      console.log(`Deleted AI Task with id ${id}`);
      
      return newTask;
    } catch (error) {
      console.error(`Error accepting AI Task with id ${id}:`, error);
      throw error;
    }
  }
  
  // Conversion functions between tasks and goals
  async convertTaskToGoal(taskId: number): Promise<Goal> {
    // Get the task
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }
    
    // Create a new goal based on the task
    const newGoal = await this.createGoal({
      userId: task.userId,
      name: task.title,
      description: task.description || '',
      category: 'Other',
      status: 'in_progress',
      target: 100,
      progress: 0,
      unit: '%',
      source: task.source || 'user',
      aiExplanation: task.aiExplanation
    });
    
    // Mark the original task as deleted
    await this.deleteTask(taskId);
    
    return newGoal;
  }
  
  async convertGoalToTask(goalId: number): Promise<Task> {
    // Get the goal
    const goal = await this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }
    
    // Create a new task based on the goal
    const newTask = await this.createTask({
      userId: goal.userId,
      title: goal.name,
      description: goal.description || '',
      priority: 'medium',
      status: 'pending',
      source: goal.source || 'user',
      aiExplanation: goal.aiExplanation
    });
    
    // Mark the original goal as deleted
    await this.deleteGoal(goalId);
    
    return newTask;
  }
  
  // Habit methods
  async getHabitsByUserId(userId: number): Promise<Habit[]> {
    return await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.userId, userId),
          isNull(habits.deletedAt)
        )
      )
      .orderBy(habits.id);
  }
  
  async getHabitById(id: number): Promise<Habit | undefined> {
    const result = await db
      .select()
      .from(habits)
      .where(eq(habits.id, id));
      
    return result[0];
  }
  
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db
      .insert(habits)
      .values(habit)
      .returning();
      
    return result[0];
  }
  
  async updateHabit(id: number, habitUpdate: Partial<Habit>): Promise<Habit> {
    const result = await db
      .update(habits)
      .set(habitUpdate)
      .where(eq(habits.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Habit with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async toggleHabitCompletion(id: number, completed: boolean): Promise<Habit> {
    const result = await db
      .update(habits)
      .set({ 
        completedToday: completed,
        lastCompletedAt: completed ? new Date().toISOString() : undefined,
        // If completed, increment the streak
        streak: completed ? sql`${habits.streak} + 1` : habits.streak
      })
      .where(eq(habits.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Habit with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async deleteHabit(id: number): Promise<void> {
    // Soft delete - set deletedAt to current date
    await db
      .update(habits)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(habits.id, id));
  }
  
  async getDeletedHabitsByUserId(userId: number): Promise<Habit[]> {
    return await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.userId, userId),
          sql`${habits.deletedAt} IS NOT NULL`
        )
      )
      .orderBy(habits.id);
  }
  
  async restoreHabit(id: number): Promise<Habit> {
    const result = await db
      .update(habits)
      .set({ deletedAt: null })
      .where(eq(habits.id, id))
      .returning();
    return result[0];
  }
  
  async permanentlyDeleteHabit(id: number): Promise<void> {
    await db
      .delete(habits)
      .where(eq(habits.id, id));
  }
  
  async getAISuggestedHabits(userId: number): Promise<Habit[]> {
    // Legacy method - redirects to getAiHabitsByUserId and converts format
    const aiHabitsResult = await this.getAiHabitsByUserId(userId);
    
    // Convert AISuggestedHabit to Habit format for backward compatibility
    return aiHabitsResult.map(aiHabit => ({
      id: aiHabit.id,
      userId: aiHabit.userId,
      title: aiHabit.title,
      description: aiHabit.description || '',
      frequency: aiHabit.frequency || 'daily',
      streak: 0,
      completedToday: false,
      lastCompletedAt: null,
      completionHistory: {},
      colorScheme: 1,
      status: 'suggested',
      source: 'ai',
      aiExplanation: aiHabit.explanation,
      deletedAt: null,
      createdAt: aiHabit.createdAt,
      updatedAt: null
    }));
  }
  
  // New AI Habit methods
  async getAiHabitsByUserId(userId: number): Promise<AISuggestedHabit[]> {
    return await db
      .select()
      .from(aiHabits)
      .where(eq(aiHabits.userId, userId))
      .orderBy(desc(aiHabits.createdAt));
  }
  
  async getAiHabitById(id: number): Promise<AISuggestedHabit | undefined> {
    const result = await db
      .select()
      .from(aiHabits)
      .where(eq(aiHabits.id, id));
      
    return result[0];
  }
  
  async createAiHabit(habit: InsertAiHabit): Promise<AISuggestedHabit> {
    // Normalize the title for better duplicate checking
    const normalizedTitle = habit.title.toLowerCase().trim();
    
    // Check if similar habit already exists in main habits table
    const existingHabits = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.userId, habit.userId),
          sql`LOWER(TRIM(${habits.title})) = ${normalizedTitle}`,
          isNull(habits.deletedAt)
        )
      );
      
    if (existingHabits.length > 0) {
      console.log(`Skipping duplicate habit: ${habit.title} (exists in main table)`);
      throw new Error(`Habit with similar title already exists`);
    }
    
    // Check if similar habit already exists in AI habits table
    const existingAiHabits = await db
      .select()
      .from(aiHabits)
      .where(
        and(
          eq(aiHabits.userId, habit.userId),
          sql`LOWER(TRIM(${aiHabits.title})) = ${normalizedTitle}`
        )
      );
      
    if (existingAiHabits.length > 0) {
      console.log(`Skipping duplicate habit: ${habit.title} (exists in AI table)`);
      throw new Error(`Habit suggestion with similar title already exists`);
    }
    
    // Create the AI habit if no duplicates were found
    const result = await db
      .insert(aiHabits)
      .values(habit)
      .returning();
      
    return result[0];
  }
  
  async deleteAiHabit(id: number): Promise<void> {
    try {
      const result = await db
        .delete(aiHabits)
        .where(eq(aiHabits.id, id))
        .returning();
      
      console.log(`Successfully deleted AI habit with ID ${id}. Rows affected: ${result.length}`);
    } catch (error) {
      console.error(`Error deleting AI habit with ID ${id}:`, error);
      throw error;
    }
  }
  
  async acceptAiHabit(id: number): Promise<Habit> {
    try {
      console.log(`Starting to accept AI habit with ID ${id}`);
      
      // Get the AI habit
      const aiHabit = await this.getAiHabitById(id);
      if (!aiHabit) {
        throw new Error(`AI Habit with id ${id} not found`);
      }
      
      console.log(`Found AI habit: ${JSON.stringify(aiHabit)}`);
      
      // Create a new habit in the main habits table
      const newHabit = await this.createHabit({
        userId: aiHabit.userId,
        title: aiHabit.title,
        description: aiHabit.description || '',
        frequency: aiHabit.frequency || 'daily',
        status: 'active',
        source: 'ai',
        aiExplanation: aiHabit.explanation
      });
      
      console.log(`Created new habit in main table: ${JSON.stringify(newHabit)}`);
      
      // Delete the AI habit
      console.log(`Now attempting to delete AI habit with ID ${id} from ai_habits table`);
      await this.deleteAiHabit(id);
      console.log(`Successfully completed the accept process for AI habit with ID ${id}`);
      
      return newHabit;
    } catch (error) {
      console.error(`Error in acceptAiHabit for ID ${id}:`, error);
      throw error;
    }
  }
  
  async getDefaultPrompts(): Promise<Prompt[]> {
    return await db
      .select()
      .from(prompts)
      .where(eq(prompts.category, "default"));
  }
  
  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const result = await db
      .insert(prompts)
      .values(prompt)
      .returning();
      
    return result[0];
  }
  
  async getSummaryByUserId(userId: number): Promise<Summary | undefined> {
    const result = await db
      .select()
      .from(summaries)
      .where(eq(summaries.userId, userId));
      
    return result[0];
  }
  
  async createOrUpdateSummary(summary: InsertSummary): Promise<Summary> {
    const existingSummary = await this.getSummaryByUserId(summary.userId);
    
    // Ensure arrays are properly formatted and convert to proper string arrays
    const formattedSummary = {
      ...summary,
      topEmotions: Array.isArray(summary.topEmotions) ? 
        summary.topEmotions.map(emotion => String(emotion)) : [],
      commonThemes: Array.isArray(summary.commonThemes) ? 
        summary.commonThemes.map(theme => String(theme)) : []
    };
    
    if (existingSummary) {
      const result = await db
        .update(summaries)
        .set(formattedSummary)
        .where(eq(summaries.userId, summary.userId))
        .returning();
        
      return result[0];
    } else {
      const result = await db
        .insert(summaries)
        .values(formattedSummary)
        .returning();
        
      return result[0];
    }
  }

  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, "unread")
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
      
    return result[0];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db
      .insert(notifications)
      .values({
        ...notification,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
      
    return result[0];
  }

  async updateNotificationStatus(id: number, status: string): Promise<Notification> {
    const result = await db
      .update(notifications)
      .set({ 
        status, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(notifications.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    return result[0];
  }

  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  async deleteAllNotificationsByUserId(userId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  // Notification preferences methods
  async getNotificationPreferencesByUserId(userId: number): Promise<NotificationPreferences | undefined> {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
      
    return result[0];
  }

  async createOrUpdateNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const existingPreferences = await this.getNotificationPreferencesByUserId(preferences.userId);
    
    if (existingPreferences) {
      const result = await db
        .update(notificationPreferences)
        .set({
          ...preferences,
          updatedAt: new Date().toISOString()
        })
        .where(eq(notificationPreferences.userId, preferences.userId))
        .returning();
        
      return result[0];
    } else {
      const result = await db
        .insert(notificationPreferences)
        .values({
          ...preferences,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();
        
      return result[0];
    }
  }
  
  // System settings methods
  async getSystemSetting(key: string): Promise<string | null> {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
      
    return result[0]?.value || null;
  }
  
  async setSystemSetting(key: string, value: string): Promise<void> {
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    
    if (existing.length > 0) {
      await db
        .update(systemSettings)
        .set({ 
          value,
          updatedAt: new Date().toISOString()
        })
        .where(eq(systemSettings.key, key));
    } else {
      await db
        .insert(systemSettings)
        .values({
          key,
          value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }
  }
  
  async storeAiSuggestions(data: { userId: number; type: string; suggestions: any[] }): Promise<void> {
    // Handle each type with the appropriate Drizzle methods
    if (data.type === 'habits') {
      // For habits, use the habits table
      // First, clear existing suggested habits from AI
      await db.delete(habits)
        .where(and(
          eq(habits.userId, data.userId),
          eq(habits.source, 'ai'),
          eq(habits.status, 'suggested')
        ));
      
      // Insert new habit suggestions
      for (const suggestion of data.suggestions) {
        await this.createHabit({
          userId: data.userId,
          title: suggestion.title || suggestion.name,
          description: suggestion.description || null,
          frequency: suggestion.frequency || 'daily',
          status: 'suggested',
          source: 'ai',
          aiExplanation: suggestion.explanation || null
        });
      }
    } else if (data.type === 'tasks') {
      // For tasks suggestions, we can't use Drizzle ORM directly since these are custom tables
      // that aren't in the schema. We'll continue to use raw SQL for these.
      try {
        // First clear existing suggestions for this user
        await this.executeRawQuery(
          `DELETE FROM ai_task_suggestions WHERE user_id = $1`, 
          [data.userId]
        );
        
        // Insert new suggestions
        for (const suggestion of data.suggestions) {
          await this.executeRawQuery(
            `INSERT INTO ai_task_suggestions (user_id, name, description) VALUES ($1, $2, $3)`,
            [data.userId, suggestion.title || suggestion.name, suggestion.description || null]
          );
        }
      } catch (error) {
        console.error('Error storing task suggestions:', error);
        // Continue execution even if there's an error
      }
    } else {
      // For goals suggestions, we can't use Drizzle ORM directly since these are custom tables
      // that aren't in the schema. We'll continue to use raw SQL for these.
      try {
        // First clear existing suggestions for this user
        await this.executeRawQuery(
          `DELETE FROM ai_goal_suggestions WHERE user_id = $1`, 
          [data.userId]
        );
        
        // Insert new suggestions
        for (const suggestion of data.suggestions) {
          await this.executeRawQuery(
            `INSERT INTO ai_goal_suggestions (user_id, name, description) VALUES ($1, $2, $3)`,
            [data.userId, suggestion.name, suggestion.description || null]
          );
        }
      } catch (error) {
        console.error('Error storing goal suggestions:', error);
        // Continue execution even if there's an error
      }
    }
  }

  private async createDefaultPrompts() {
    // Check if default prompts already exist
    const existingPrompts = await db
      .select()
      .from(prompts)
      .where(eq(prompts.category, "default"));
      
    if (existingPrompts.length > 0) {
      return; // Default prompts already exist
    }
    
    const defaultPrompts = [
      "What are three things that went well today, and why?",
      "When did you feel most at peace this week?",
      "What's one small step you can take tomorrow to feel better?",
      "What made you smile today?",
      "If you could change one thing about today, what would it be?",
      "What are you grateful for right now?",
      "What's a challenge you're facing, and how might you overcome it?",
      "Describe a moment when you felt proud of yourself recently.",
      "What self-care activity would make tomorrow better?",
      "What boundaries do you need to set or maintain for your wellbeing?"
    ];
    
    for (const text of defaultPrompts) {
      await this.createPrompt({
        text,
        category: "default"
      });
    }
  }
}

export const storage = new DatabaseStorage();