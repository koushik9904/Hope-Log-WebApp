import { storage } from '../storage';
import { db } from '../db';
import { eq, sql } from 'drizzle-orm';
import { userUsage, featureLimits, users } from '@shared/schema';

/**
 * Service for checking feature limits and user usage
 */
export class FeatureLimitService {
  
  /**
   * Creates or updates user usage record
   */
  static async initUserUsage(userId: number): Promise<void> {
    // Check if user usage record exists
    const [existingUsage] = await db.select()
      .from(userUsage)
      .where(eq(userUsage.userId, userId));
    
    if (!existingUsage) {
      // Create a new usage record
      await db.insert(userUsage)
        .values({
          userId,
          journalEntriesCount: 0,
          goalsCount: 0,
          aiResponsesCount: 0,
          aiResponsesResetDate: new Date(),
          lastActive: new Date()
        });
    } else {
      // Update last active timestamp
      await db.update(userUsage)
        .set({ lastActive: new Date() })
        .where(eq(userUsage.userId, userId));
    }
  }

  /**
   * Gets the feature limits for a user based on their subscription tier
   */
  static async getFeatureLimits(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const tier = user.subscriptionTier || 'free';
    const [limits] = await db.select().from(featureLimits).where(eq(featureLimits.subscriptionTier, tier));

    return limits || null;
  }

  /**
   * Gets current usage for a user
   */
  static async getUserUsage(userId: number) {
    await this.initUserUsage(userId);
    
    const [usage] = await db.select().from(userUsage).where(eq(userUsage.userId, userId));
    return usage;
  }

  /**
   * Checks if a user can create a new journal entry based on their subscription limits
   */
  static async canCreateJournalEntry(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    const usage = await this.getUserUsage(userId);

    // If no limit is set (null), then the user has unlimited access
    if (!limits || limits.maxJournalEntries === null) {
      return { allowed: true };
    }

    if (usage.journalEntriesCount >= limits.maxJournalEntries) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${limits.maxJournalEntries} journal entries. Please upgrade to Pro for unlimited entries.`
      };
    }

    return { allowed: true };
  }

  /**
   * Increments journal entry count when a user creates a journal entry
   */
  static async incrementJournalEntryCount(userId: number): Promise<void> {
    await this.initUserUsage(userId);
    
    await db.update(userUsage)
      .set({
        journalEntriesCount: sql`${userUsage.journalEntriesCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(userUsage.userId, userId));
  }

  /**
   * Checks if a user can create a new goal based on their subscription limits
   */
  static async canCreateGoal(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    const usage = await this.getUserUsage(userId);

    // If no limit is set (null), then the user has unlimited access
    if (!limits || limits.maxGoals === null) {
      return { allowed: true };
    }

    if (usage.goalsCount >= limits.maxGoals) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${limits.maxGoals} goals. Please upgrade to Pro for unlimited goals.`
      };
    }

    return { allowed: true };
  }

  /**
   * Increments goal count when a user creates a goal
   */
  static async incrementGoalCount(userId: number): Promise<void> {
    await this.initUserUsage(userId);
    
    await db.update(userUsage)
      .set({
        goalsCount: sql`${userUsage.goalsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(userUsage.userId, userId));
  }

  /**
   * Checks if a user can use an AI response based on their daily quota
   */
  static async canUseAiResponse(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    const usage = await this.getUserUsage(userId);

    // Check if we need to reset the AI response count (new day)
    const resetDate = new Date(usage.aiResponsesResetDate);
    const now = new Date();
    if (now.getDate() !== resetDate.getDate() || 
        now.getMonth() !== resetDate.getMonth() || 
        now.getFullYear() !== resetDate.getFullYear()) {
      // Reset counter for a new day
      await db.update(userUsage)
        .set({
          aiResponsesCount: 0,
          aiResponsesResetDate: now,
          updatedAt: now
        })
        .where(eq(userUsage.userId, userId));
      
      return { allowed: true };
    }

    // If no limit is set (null), then the user has unlimited access
    if (!limits || limits.aiResponsesPerDay === null) {
      return { allowed: true };
    }

    if (usage.aiResponsesCount >= limits.aiResponsesPerDay) {
      return {
        allowed: false,
        reason: `You've reached your daily limit of ${limits.aiResponsesPerDay} AI responses. Please upgrade to Pro for a higher limit.`
      };
    }

    return { allowed: true };
  }

  /**
   * Increments AI response count when a user gets an AI response
   */
  static async incrementAiResponseCount(userId: number): Promise<void> {
    await this.initUserUsage(userId);
    
    await db.update(userUsage)
      .set({
        aiResponsesCount: sql`${userUsage.aiResponsesCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(userUsage.userId, userId));
  }

  /**
   * Checks if a user has access to insights
   */
  static async canAccessInsights(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    
    if (!limits || limits.insightsAccess) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Advanced insights are only available with a Pro subscription. Please upgrade to access this feature.'
    };
  }

  /**
   * Checks if a user can access weekly digests
   */
  static async canAccessWeeklyDigest(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    
    if (!limits || limits.weeklyDigestAccess) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Weekly digests are only available with a Pro subscription. Please upgrade to access this feature.'
    };
  }

  /**
   * Checks if a user can access and create custom prompts
   */
  static async canAccessCustomPrompts(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    
    if (!limits || limits.customPromptsAccess) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Custom prompts are only available with a Pro subscription. Please upgrade to access this feature.'
    };
  }

  /**
   * Checks if a user can export their data
   */
  static async canExportData(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    
    if (!limits || limits.exportAccess) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Data export is only available with a Pro subscription. Please upgrade to access this feature.'
    };
  }

  /**
   * Checks if a user can access community features
   */
  static async canAccessCommunity(userId: number): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getFeatureLimits(userId);
    
    if (!limits || limits.communityAccess) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: 'Community access is only available with a Pro subscription. Please upgrade to access this feature.'
    };
  }
}