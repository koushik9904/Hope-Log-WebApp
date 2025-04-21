import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  avatar: text("avatar"),
  provider: text("provider"), // 'local', 'google', 'apple'
  providerId: text("provider_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  provider: true,
  providerId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  date: timestamp("date", { mode: 'string' }).notNull(),
  isAiResponse: boolean("is_ai_response").notNull().default(false),
  isJournal: boolean("is_journal").notNull().default(false),
  transcript: text("transcript"),  // For storing complete chat transcripts when saving
  sentiment: jsonb("sentiment").$type<{
    score: number;
    emotions: string[];
    themes: string[];
  }>(),
  deletedAt: timestamp("deleted_at", { mode: 'string' }),  // For recycle bin/soft delete functionality
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries)
  .omit({ id: true })
  .extend({
    date: z.string().datetime(),
    sentiment: z
      .object({
        score: z.number(),
        emotions: z.array(z.string()),
        themes: z.array(z.string()),
      })
      .optional(),
  });

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Moods table
export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  date: timestamp("date", { mode: 'string' }).notNull(),
});

export const insertMoodSchema = createInsertSchema(moods)
  .omit({ id: true })
  .extend({
    date: z.string().datetime(),
  });

export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Mood = typeof moods.$inferSelect;

// Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Personal"),
  targetDate: text("target_date"),
  target: integer("target").notNull(),
  progress: integer("progress").notNull().default(0),
  unit: text("unit").notNull().default("%"),
  colorScheme: integer("color_scheme").notNull().default(1),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Prompts table
export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category").notNull().default("default"),
});

export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true });

export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

// Summaries table
export const summaries = pgTable("summaries", {
  userId: integer("user_id").primaryKey(),
  topEmotions: jsonb("top_emotions").$type<string[]>().notNull(),
  commonThemes: jsonb("common_themes").$type<string[]>().notNull(),
  insights: text("insights").notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
});

export const insertSummarySchema = createInsertSchema(summaries);

export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;

// Journal Embeddings table for RAG implementation
export const journalEmbeddings = pgTable("journal_embeddings", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  embeddingJson: jsonb("embedding_json").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const insertJournalEmbeddingSchema = createInsertSchema(journalEmbeddings)
  .omit({ id: true, createdAt: true });

export type InsertJournalEmbedding = z.infer<typeof insertJournalEmbeddingSchema>;
export type JournalEmbedding = typeof journalEmbeddings.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'reminder', 'goal', 'streak', 'system'
  status: text("status").default("unread").notNull(), // 'unread', 'read', 'dismissed'
  scheduledFor: timestamp("scheduled_for", { mode: 'string' }), // For scheduled notifications/reminders
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringPattern: text("recurring_pattern"), // 'daily', 'weekly', 'monthly', or cron syntax
});

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    scheduledFor: z.string().datetime().optional(),
  });

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// User preferences for notifications
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  journalReminders: boolean("journal_reminders").default(true).notNull(),
  goalReminders: boolean("goal_reminders").default(true).notNull(),
  weeklyDigest: boolean("weekly_digest").default(true).notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  browserNotifications: boolean("browser_notifications").default(true).notNull(),
  reminderTime: text("reminder_time").default("09:00").notNull(), // Default time for daily reminders (24hr format)
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
