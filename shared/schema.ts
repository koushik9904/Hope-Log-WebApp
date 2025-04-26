import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(), // Now required and unique
  avatar: text("avatar"),
  provider: text("provider"), // 'local', 'google', 'apple'
  providerId: text("provider_id"),
  isAdmin: boolean("is_admin").default(false),
  isVerified: boolean("is_verified").default(false), // New field for email verification
  verificationToken: text("verification_token"), // For email verification
  resetPasswordToken: text("reset_password_token"), // For password reset
  resetPasswordExpires: timestamp("reset_password_expires", { mode: 'string' }),
  subscriptionTier: text("subscription_tier").default("free").notNull(), // 'free', 'pro'
  subscriptionStatus: text("subscription_status").default("active").notNull(), // 'active', 'trial', 'expired', 'cancelled'
  subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: 'string' }),
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
  isAdmin: true,
  isVerified: true,
  verificationToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  subscriptionExpiresAt: true,
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
  timezone: text("timezone"), // User's preferred timezone for date/time display
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// Habits table
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull().default("daily"),
  streak: integer("streak").notNull().default(0),
  completedToday: boolean("completed_today").notNull().default(false),
  lastCompletedAt: timestamp("last_completed_at", { mode: 'string' }),
  deletedAt: timestamp("deleted_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow()
});

export const insertHabitSchema = createInsertSchema(habits).omit({ 
  id: true, 
  streak: true, 
  completedToday: true, 
  lastCompletedAt: true,
  deletedAt: true,
  createdAt: true, 
  updatedAt: true 
});

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

// System settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow()
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({ id: true });
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  interval: text("interval").notNull().default("month"), // 'month', 'year'
  features: jsonb("features").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Subscriptions table (links users to plans)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  startDate: timestamp("start_date", { mode: 'string' }).notNull().defaultNow(),
  endDate: timestamp("end_date", { mode: 'string' }),
  paypalSubscriptionId: text("paypal_subscription_id"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Payment transactions table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method").notNull(), // 'paypal', etc.
  paymentId: text("payment_id"), // ID from payment provider
  status: text("status").notNull(), // 'completed', 'pending', 'failed', 'refunded'
  paymentDate: timestamp("payment_date", { mode: 'string' }).notNull().defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Feature limitations table - controls what features are available for different subscription tiers
export const featureLimits = pgTable("feature_limits", {
  id: serial("id").primaryKey(),
  subscriptionTier: text("subscription_tier").notNull().unique(), // 'free', 'pro'
  maxJournalEntries: integer("max_journal_entries"), // null means unlimited
  maxGoals: integer("max_goals"),
  aiResponsesPerDay: integer("ai_responses_per_day"),
  insightsAccess: boolean("insights_access").notNull().default(false),
  customPromptsAccess: boolean("custom_prompts_access").notNull().default(false),
  weeklyDigestAccess: boolean("weekly_digest_access").notNull().default(false),
  moodTrackingAccess: boolean("mood_tracking_access").notNull().default(true),
  exportAccess: boolean("export_access").notNull().default(false),
  communityAccess: boolean("community_access").notNull().default(false),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertFeatureLimitSchema = createInsertSchema(featureLimits).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureLimit = z.infer<typeof insertFeatureLimitSchema>;
export type FeatureLimit = typeof featureLimits.$inferSelect;

// User usage tracking to enforce limits
export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  journalEntriesCount: integer("journal_entries_count").notNull().default(0),
  goalsCount: integer("goals_count").notNull().default(0),
  aiResponsesCount: integer("ai_responses_count").notNull().default(0),
  aiResponsesResetDate: timestamp("ai_responses_reset_date", { mode: 'string' }).notNull().defaultNow(),
  lastActive: timestamp("last_active", { mode: 'string' }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const insertUserUsageSchema = createInsertSchema(userUsage).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
export type UserUsage = typeof userUsage.$inferSelect;