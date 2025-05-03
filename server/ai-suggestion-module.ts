import { db } from "./db";
import { storage } from "./storage";
import { JournalEntry } from "@shared/schema";
import { generateCombinedSuggestions } from "./openai";

/**
 * Unified AI Suggestion Module
 * 
 * This module is responsible for analyzing user journals and chat entries to extract
 * both Goals and Tasks. It will automatically trigger every time a new journal
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
  try {
    // Skip entries that aren't full journal entries (like chat messages)
    if (!journalEntry.isJournal) {
      return {
        goalsCreated: 0,
        tasksCreated: 0,
        habitsCreated: 0,
        goalsSkipped: 0,
        tasksSkipped: 0,
        habitsSkipped: 0
      };
    }

    // Skip entries that have already been analyzed
    if (journalEntry.analyzed) {
      return {
        goalsCreated: 0,
        tasksCreated: 0,
        habitsCreated: 0,
        goalsSkipped: 0,
        tasksSkipped: 0,
        habitsSkipped: 0
      };
    }

    const userId = journalEntry.userId;
    
    // Get existing goals, tasks and habits to avoid duplicates
    const existingGoals = await storage.getGoalsByUserId(userId);
    const existingTasks = await storage.getTasksByUserId(userId);
    const existingHabits = await storage.getHabitsByUserId(userId);
    
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
    const suggestions = await generateCombinedSuggestions(
      [journalEntryFormatted], 
      existingGoals, 
      existingTasksFormatted,
      existingHabitsFormatted
    );
    
    let result: SuggestionResult = {
      goalsCreated: 0,
      tasksCreated: 0,
      habitsCreated: 0,
      goalsSkipped: 0,
      tasksSkipped: 0,
      habitsSkipped: 0
    };
    
    // Process goal suggestions
    if (suggestions.goals && suggestions.goals.length > 0) {
      for (const suggestion of suggestions.goals) {
        // Check if a similar goal already exists by comparing normalized names
        const normalizedSuggestion = suggestion.name.toLowerCase().trim();
        const similarGoalExists = existingGoals.some(
          existingGoal => existingGoal.name.toLowerCase().trim() === normalizedSuggestion
        );
        
        if (!similarGoalExists) {
          // Create a new goal with suggested status and ai source
          await storage.createGoal({
            userId,
            name: suggestion.name,
            description: suggestion.description || "",
            category: suggestion.category || "Personal",
            target: 100, // Default target
            status: "suggested",
            source: "ai",
            aiExplanation: suggestion.explanation || "Generated from your journal entries"
          });
          
          result.goalsCreated++;
        } else {
          result.goalsSkipped++;
        }
      }
    }
    
    // Process task suggestions
    if (suggestions.tasks && suggestions.tasks.length > 0) {
      for (const suggestion of suggestions.tasks) {
        // Check if a similar task already exists
        const normalizedSuggestion = suggestion.title.toLowerCase().trim();
        const similarTaskExists = existingTasks.some(
          existingTask => existingTask.title.toLowerCase().trim() === normalizedSuggestion
        );
        
        if (!similarTaskExists) {
          // Create a new task with suggested status and ai source
          await storage.createTask({
            userId,
            title: suggestion.title,
            description: suggestion.description || "",
            priority: suggestion.priority || "medium",
            goalId: suggestion.goalId || null,
            status: "suggested",
            source: "ai",
            aiExplanation: suggestion.explanation || "Generated from your journal entries"
          });
          
          result.tasksCreated++;
        } else {
          result.tasksSkipped++;
        }
      }
    }
    
    // Process habit suggestions
    if (suggestions.habits && suggestions.habits.length > 0) {
      for (const suggestion of suggestions.habits) {
        // Check if a similar habit already exists
        const normalizedSuggestion = suggestion.title.toLowerCase().trim();
        const similarHabitExists = existingHabits.some(
          existingHabit => existingHabit.title.toLowerCase().trim() === normalizedSuggestion
        );
        
        if (!similarHabitExists) {
          // Create a new habit with suggested status and ai source
          await storage.createHabit({
            userId,
            title: suggestion.title,
            description: suggestion.description || "",
            frequency: suggestion.frequency || "daily",
            status: "suggested",
            source: "ai",
            aiExplanation: suggestion.explanation || "Generated from your journal entries"
          });
          
          result.habitsCreated++;
        } else {
          result.habitsSkipped++;
        }
      }
    }
    
    // Mark the journal entry as analyzed
    await storage.updateJournalEntry(journalEntry.id, { analyzed: true });
    
    return result;
  } catch (error) {
    console.error(`Error processing journal entry ${journalEntry.id}:`, error);
    throw error;
  }
}

/**
 * Process all unanalyzed journal entries for a user
 * @param userId The user ID to process entries for
 * @returns Summary of suggestions created
 */
export async function processAllEntriesForUser(userId: number): Promise<SuggestionResult> {
  try {
    // Get recent unanalyzed journal entries
    const journalEntries = await storage.getUnanalyzedJournalEntriesByUserId(userId);
    
    console.log(`Found ${journalEntries.length} unanalyzed journal entries for user ${userId}`);
    
    // Process each entry
    let totalResult: SuggestionResult = {
      goalsCreated: 0,
      tasksCreated: 0,
      habitsCreated: 0,
      goalsSkipped: 0,
      tasksSkipped: 0,
      habitsSkipped: 0
    };
    
    for (const entry of journalEntries) {
      const result = await processSingleEntry(entry);
      totalResult.goalsCreated += result.goalsCreated;
      totalResult.tasksCreated += result.tasksCreated;
      totalResult.habitsCreated += result.habitsCreated;
      totalResult.goalsSkipped += result.goalsSkipped;
      totalResult.tasksSkipped += result.tasksSkipped;
      totalResult.habitsSkipped += result.habitsSkipped;
    }
    
    return totalResult;
  } catch (error) {
    console.error(`Error processing all entries for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Process all unanalyzed journal entries for all users
 * This can be run as a scheduled job
 */
export async function processAllEntries(): Promise<void> {
  try {
    const users = await storage.getAllUsers();
    console.log(`Processing entries for ${users.length} users`);
    
    for (const user of users) {
      try {
        const result = await processAllEntriesForUser(user.id);
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