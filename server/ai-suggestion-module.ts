import { db } from "./db";
import { storage } from "./storage";
import { JournalEntry } from "@shared/schema";
import { generateCombinedSuggestions } from "./openai";

/**
 * Unified AI Suggestion Module
 * 
 * This module is responsible for analyzing user journals and chat entries to extract
 * Goals, Tasks, and Habits. It will automatically trigger every time a new journal
 * or chat is saved and only process entries that haven't been analyzed yet.
 */

interface SuggestionResult {
  goalsCreated: number;
  tasksCreated: number;
  habitsCreated: number;
  goalsSkipped: number;
  tasksSkipped: number;
  habitsSkipped: number;
}

/**
 * Process a single journal entry and generate suggestions
 * @param journalEntry The journal entry to analyze
 * @returns Summary of suggestions created
 */
export async function processSingleEntry(journalEntry: JournalEntry): Promise<SuggestionResult> {
  const emptyResult: SuggestionResult = {
    goalsCreated: 0,
    tasksCreated: 0,
    habitsCreated: 0,
    goalsSkipped: 0,
    tasksSkipped: 0,
    habitsSkipped: 0
  };

  try {
    // Skip entries that aren't full journal entries (like chat messages)
    if (!journalEntry.isJournal) {
      console.log(`Skipping entry ${journalEntry.id} - not a journal entry`);
      return emptyResult;
    }

    // Skip entries that have already been analyzed
    if (journalEntry.analyzed) {
      console.log(`Skipping entry ${journalEntry.id} - already analyzed`);
      return emptyResult;
    }

    const userId = journalEntry.userId;
    console.log(`Processing journal entry ${journalEntry.id} for user ${userId}`);
    
    // Get existing goals, tasks and habits to avoid duplicates
    const existingGoals = await storage.getGoalsByUserId(userId);
    const existingTasks = await storage.getTasksByUserId(userId);
    const existingHabits = await storage.getHabitsByUserId(userId);
    
    console.log(`Found ${existingGoals.length} existing goals, ${existingTasks.length} tasks, and ${existingHabits.length} habits`);
    
    // Format entries and tasks for the AI
    const journalEntryFormatted = {
      content: journalEntry.content,
      date: journalEntry.date,
      id: journalEntry.id
    };
    
    const existingTasksFormatted = existingTasks.map(task => ({
      title: task.title,
      status: task.completed ? 'completed' : 'pending'
    }));
    
    const existingHabitsFormatted = existingHabits.map(habit => ({
      title: habit.title,
      frequency: habit.frequency
    }));
    
    // Generate combined suggestions using the new unified approach
    let suggestions;
    try {
      console.log(`Generating suggestions for entry ${journalEntry.id}`);
      suggestions = await generateCombinedSuggestions(
        [journalEntryFormatted], 
        existingGoals, 
        existingTasksFormatted,
        existingHabitsFormatted
      );
      console.log(`Successfully generated suggestions: ${suggestions.goals?.length || 0} goals, ${suggestions.tasks?.length || 0} tasks, ${suggestions.habits?.length || 0} habits`);
    } catch (aiError) {
      console.error(`Error generating suggestions for entry ${journalEntry.id}:`, aiError);
      // Mark as analyzed even if AI fails to prevent retrying
      await storage.updateJournalEntry(journalEntry.id, { analyzed: true });
      return emptyResult;
    }
    
    let result: SuggestionResult = {
      goalsCreated: 0,
      tasksCreated: 0,
      habitsCreated: 0,
      goalsSkipped: 0,
      tasksSkipped: 0,
      habitsSkipped: 0
    };
    
    // Process goal suggestions to AI goals table
    if (suggestions.goals && suggestions.goals.length > 0) {
      for (const suggestion of suggestions.goals) {
        try {
          // Create in the aiGoals table instead of goals table
          await storage.createAiGoal({
            userId,
            name: suggestion.name,
            description: suggestion.description || "",
            category: suggestion.category || "Personal",
            explanation: suggestion.explanation || "Generated from your journal entries",
            journalEntryId: journalEntry.id
          });
          
          result.goalsCreated++;
          console.log(`Created AI goal suggestion: ${suggestion.name}`);
        } catch (goalError) {
          console.error(`Error creating AI goal "${suggestion.name}":`, goalError);
          result.goalsSkipped++;
        }
      }
    }
    
    // Process task suggestions to AI tasks table
    if (suggestions.tasks && suggestions.tasks.length > 0) {
      for (const suggestion of suggestions.tasks) {
        try {
          // Create in the aiTasks table instead of tasks table
          await storage.createAiTask({
            userId,
            title: suggestion.title,
            description: suggestion.description || "",
            priority: suggestion.priority || "medium",
            goalId: suggestion.goalId || null,
            explanation: suggestion.explanation || "Generated from your journal entries",
            journalEntryId: journalEntry.id
          });
          
          result.tasksCreated++;
          console.log(`Created AI task suggestion: ${suggestion.title}`);
        } catch (taskError) {
          console.error(`Error creating AI task "${suggestion.title}":`, taskError);
          result.tasksSkipped++;
        }
      }
    }
    
    // Process habit suggestions to AI habits table
    if (suggestions.habits && suggestions.habits.length > 0) {
      for (const suggestion of suggestions.habits) {
        try {
          // Create in the aiHabits table instead of habits table
          await storage.createAiHabit({
            userId,
            title: suggestion.title,
            description: suggestion.description || "",
            frequency: suggestion.frequency || "daily",
            explanation: suggestion.explanation || "Generated from your journal entries",
            journalEntryId: journalEntry.id
          });
          
          result.habitsCreated++;
          console.log(`Created AI habit suggestion: ${suggestion.title}`);
        } catch (habitError) {
          console.error(`Error creating AI habit "${suggestion.title}":`, habitError);
          result.habitsSkipped++;
        }
      }
    }
    
    // Mark the journal entry as analyzed
    try {
      await storage.updateJournalEntry(journalEntry.id, { analyzed: true });
      console.log(`Successfully marked entry ${journalEntry.id} as analyzed`);
    } catch (updateError) {
      console.error(`Failed to mark entry ${journalEntry.id} as analyzed:`, updateError);
    }
    
    return result;
  } catch (error) {
    console.error(`Error processing journal entry ${journalEntry.id}:`, error);
    
    // Always try to mark as analyzed even if there was an error
    try {
      await storage.updateJournalEntry(journalEntry.id, { analyzed: true });
      console.log(`Marked entry ${journalEntry.id} as analyzed after error`);
    } catch (updateError) {
      console.error(`Failed to mark entry ${journalEntry.id} as analyzed after error:`, updateError);
    }
    
    return emptyResult;
  }
}

/**
 * Process all unanalyzed journal entries for a user
 * @param userId The user ID to process entries for
 * @param maxEntries Maximum number of entries to process at once
 * @returns Summary of suggestions created
 */
export async function processAllEntriesForUser(userId: number, maxEntries: number = 5): Promise<SuggestionResult> {
  try {
    // Get recent unanalyzed journal entries
    console.log(`⏳ Fetching unanalyzed journal entries for user ${userId}...`);
    const journalEntries = await storage.getUnanalyzedJournalEntriesByUserId(userId);
    
    if (!journalEntries || journalEntries.length === 0) {
      console.log(`ℹ️ No unanalyzed journal entries found for user ${userId}`);
      return {
        goalsCreated: 0,
        tasksCreated: 0,
        habitsCreated: 0,
        goalsSkipped: 0,
        tasksSkipped: 0,
        habitsSkipped: 0
      };
    }
    
    // Limit the number of entries to process at once
    const entriesToProcess = journalEntries.slice(0, maxEntries);
    
    console.log(`✅ Found ${journalEntries.length} unanalyzed journal entries for user ${userId}, processing ${entriesToProcess.length}`);
    console.log(`ℹ️ Entry IDs to process: ${entriesToProcess.map(e => e.id).join(', ')}`);
    
    // Process each entry
    let totalResult: SuggestionResult = {
      goalsCreated: 0,
      tasksCreated: 0,
      habitsCreated: 0,
      goalsSkipped: 0,
      tasksSkipped: 0,
      habitsSkipped: 0
    };
    
    for (const entry of entriesToProcess) {
      try {
        const result = await processSingleEntry(entry);
        totalResult.goalsCreated += result.goalsCreated;
        totalResult.tasksCreated += result.tasksCreated;
        totalResult.habitsCreated += result.habitsCreated;
        totalResult.goalsSkipped += result.goalsSkipped;
        totalResult.tasksSkipped += result.tasksSkipped;
        totalResult.habitsSkipped += result.habitsSkipped;
      } catch (entryError) {
        console.error(`Error processing entry ${entry.id}, marking as analyzed to prevent future retries:`, entryError);
        // Mark as analyzed even if it fails to prevent repeated processing attempts
        await storage.updateJournalEntry(entry.id, { analyzed: true });
      }
    }
    
    return totalResult;
  } catch (error) {
    console.error(`Error processing entries for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Process all unanalyzed journal entries for all users
 * This can be run as a scheduled job
 * @param maxEntriesPerUser Maximum number of entries to process per user
 */
export async function processAllEntries(maxEntriesPerUser: number = 5): Promise<void> {
  try {
    const users = await storage.getAllUsers();
    console.log(`Processing entries for ${users.length} users (max ${maxEntriesPerUser} entries per user)`);
    
    for (const user of users) {
      try {
        const result = await processAllEntriesForUser(user.id, maxEntriesPerUser);
        console.log(`User ${user.id}: ${result.goalsCreated} goals, ${result.tasksCreated} tasks, and ${result.habitsCreated} habits created`);
      } catch (error) {
        console.error(`Error processing entries for user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error processing all entries:", error);
    throw error;
  }
}