import { 
  User, InsertUser, 
  JournalEntry, InsertJournalEntry, 
  Mood, InsertMood, 
  Goal, InsertGoal, 
  Prompt, InsertPrompt, 
  Summary, InsertSummary, 
  Notification, InsertNotification,
  NotificationPreferences, InsertNotificationPreferences,
  users, journalEntries, moods, goals, prompts, summaries,
  notifications, notificationPreferences 
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, gte, desc, sql, isNull } from "drizzle-orm";
import createMemoryStore from "memorystore";

// Interfaces for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // System settings methods
  getSystemSetting(key: string): Promise<string | null>;
  setSystemSetting(key: string, value: string): Promise<void>;
  
  // Journal methods
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;
  getRecentJournalEntriesByUserId(userId: number, limit: number): Promise<JournalEntry[]>;
  getJournalEntriesForLastWeek(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
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
  
  constructor() {
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
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
        sentiment: entry.sentiment || { score: 3, emotions: [], themes: [] }
      })
      .returning();
      
    return result[0];
  }
  
  async updateJournalEntrySentiment(
    id: number,
    sentiment: { score: number; emotions: string[]; themes: string[] }
  ): Promise<JournalEntry> {
    const result = await db
      .update(journalEntries)
      .set({ sentiment })
      .where(eq(journalEntries.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Journal entry with id ${id} not found`);
    }
    
    return result[0];
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
      .where(eq(goals.userId, userId))
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
      .delete(goals)
      .where(eq(goals.id, id));
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