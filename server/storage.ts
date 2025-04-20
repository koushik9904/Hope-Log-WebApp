import { User, InsertUser, JournalEntry, InsertJournalEntry, Mood, InsertMood, Goal, InsertGoal, Prompt, InsertPrompt, Summary, InsertSummary, users, journalEntries, moods, goals, prompts, summaries } from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";
import createMemoryStore from "memorystore";

// Interfaces for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Journal methods
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;
  getRecentJournalEntriesByUserId(userId: number, limit: number): Promise<JournalEntry[]>;
  getJournalEntriesForLastWeek(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntrySentiment(id: number, sentiment: { score: number; emotions: string[]; themes: string[] }): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<void>;
  
  // Mood methods
  getMoodsByUserId(userId: number): Promise<Mood[]>;
  getRecentMoodsByUserId(userId: number, limit: number): Promise<Mood[]>;
  createMood(mood: InsertMood): Promise<Mood>;
  
  // Goal methods
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  getGoalById(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoalProgress(id: number, progress: number): Promise<Goal>;
  
  // Prompt methods
  getDefaultPrompts(): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  
  // Summary methods
  getSummaryByUserId(userId: number): Promise<Summary | undefined>;
  createOrUpdateSummary(summary: InsertSummary): Promise<Summary>;
  
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
  
  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
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
      .where(eq(journalEntries.userId, userId))
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
    
    if (existingSummary) {
      const result = await db
        .update(summaries)
        .set(summary)
        .where(eq(summaries.userId, summary.userId))
        .returning();
        
      return result[0];
    } else {
      const result = await db
        .insert(summaries)
        .values(summary)
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