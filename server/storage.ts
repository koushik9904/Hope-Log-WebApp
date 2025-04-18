import { User, InsertUser, JournalEntry, InsertJournalEntry, Mood, InsertMood, Goal, InsertGoal, Prompt, InsertPrompt, Summary, InsertSummary } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interfaces for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Journal methods
  getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]>;
  getRecentJournalEntriesByUserId(userId: number, limit: number): Promise<JournalEntry[]>;
  getJournalEntriesForLastWeek(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntrySentiment(id: number, sentiment: { score: number; emotions: string[]; themes: string[] }): Promise<JournalEntry>;
  
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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journalEntries: Map<number, JournalEntry>;
  private moods: Map<number, Mood>;
  private goals: Map<number, Goal>;
  private prompts: Map<number, Prompt>;
  private summaries: Map<number, Summary>;
  
  private userIdCounter: number;
  private journalIdCounter: number;
  private moodIdCounter: number;
  private goalIdCounter: number;
  private promptIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.journalEntries = new Map();
    this.moods = new Map();
    this.goals = new Map();
    this.prompts = new Map();
    this.summaries = new Map();
    
    this.userIdCounter = 1;
    this.journalIdCounter = 1;
    this.moodIdCounter = 1;
    this.goalIdCounter = 1;
    this.promptIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create default prompts
    this.createDefaultPrompts();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Journal methods
  async getJournalEntriesByUserId(userId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getRecentJournalEntriesByUserId(userId: number, limit: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
  
  async getJournalEntriesForLastWeek(userId: number): Promise<JournalEntry[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return Array.from(this.journalEntries.values())
      .filter(entry => 
        entry.userId === userId && 
        new Date(entry.date).getTime() >= oneWeekAgo.getTime()
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.journalIdCounter++;
    const newEntry: JournalEntry = { 
      ...entry, 
      id, 
      sentiment: entry.sentiment || { score: 3, emotions: [], themes: [] }
    };
    this.journalEntries.set(id, newEntry);
    return newEntry;
  }
  
  async updateJournalEntrySentiment(
    id: number, 
    sentiment: { score: number; emotions: string[]; themes: string[] }
  ): Promise<JournalEntry> {
    const entry = this.journalEntries.get(id);
    if (!entry) throw new Error("Journal entry not found");
    
    const updatedEntry = { ...entry, sentiment };
    this.journalEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  // Mood methods
  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter(mood => mood.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getRecentMoodsByUserId(userId: number, limit: number): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter(mood => mood.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
  
  async createMood(mood: InsertMood): Promise<Mood> {
    const id = this.moodIdCounter++;
    const newMood: Mood = { ...mood, id };
    this.moods.set(id, newMood);
    return newMood;
  }
  
  // Goal methods
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId);
  }
  
  async getGoalById(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const newGoal: Goal = { ...goal, id };
    this.goals.set(id, newGoal);
    return newGoal;
  }
  
  async updateGoalProgress(id: number, progress: number): Promise<Goal> {
    const goal = this.goals.get(id);
    if (!goal) throw new Error("Goal not found");
    
    const updatedGoal = { ...goal, progress };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  // Prompt methods
  async getDefaultPrompts(): Promise<Prompt[]> {
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.category === "default");
  }
  
  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const id = this.promptIdCounter++;
    const newPrompt: Prompt = { ...prompt, id };
    this.prompts.set(id, newPrompt);
    return newPrompt;
  }
  
  // Summary methods
  async getSummaryByUserId(userId: number): Promise<Summary | undefined> {
    return Array.from(this.summaries.values())
      .find(summary => summary.userId === userId);
  }
  
  async createOrUpdateSummary(summary: InsertSummary): Promise<Summary> {
    const existingSummary = await this.getSummaryByUserId(summary.userId);
    
    if (existingSummary) {
      // Update existing summary
      const updatedSummary: Summary = { 
        ...existingSummary, 
        topEmotions: summary.topEmotions,
        commonThemes: summary.commonThemes,
        insights: summary.insights,
        updatedAt: summary.updatedAt
      };
      this.summaries.set(existingSummary.userId, updatedSummary);
      return updatedSummary;
    } else {
      // Create new summary
      const newSummary: Summary = { ...summary };
      this.summaries.set(summary.userId, newSummary);
      return newSummary;
    }
  }
  
  // Helper methods
  private async createDefaultPrompts() {
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

export const storage = new MemStorage();
