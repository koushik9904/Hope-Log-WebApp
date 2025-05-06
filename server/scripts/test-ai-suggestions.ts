/**
 * Test script for the AI suggestion module
 * 
 * This script allows you to test the AI suggestion module by:
 * 1. Marking all entries as unanalyzed (optional)
 * 2. Processing a specific user's journal entries
 * 3. Listing all AI suggestions for a user
 */

import { processAllEntriesForUser } from "../ai-suggestion-module";
import { storage } from "../storage";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const userId = parseInt(process.argv[2]);
const resetFlag = process.argv[3] === "--reset";

async function main() {
  if (!userId) {
    console.error("❌ Please provide a user ID as the first argument");
    console.log("Usage: tsx server/scripts/test-ai-suggestions.ts <userId> [--reset]");
    console.log("  --reset: Optional flag to mark all entries as unanalyzed first");
    process.exit(1);
  }

  try {
    console.log(`🔍 Testing AI suggestions for user ID: ${userId}`);
    
    // Check if the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username}`);
    
    // If reset flag is passed, mark all entries as unanalyzed
    if (resetFlag) {
      console.log(`🔄 Marking all journal entries for user ${userId} as unanalyzed...`);
      const entries = await storage.getJournalEntriesByUserId(userId);
      console.log(`📝 Found ${entries.length} entries`);
      
      for (const entry of entries) {
        await storage.updateJournalEntry(entry.id, { analyzed: false });
        console.log(`✅ Marked entry ${entry.id} as unanalyzed`);
      }
    }
    
    // Get current AI suggestions counts
    const beforeGoals = await storage.getAiGoalsByUserId(userId);
    const beforeTasks = await storage.getAiTasksByUserId(userId);
    const beforeHabits = await storage.getAiHabitsByUserId(userId);
    
    console.log(`
Before processing:
- AI Goals: ${beforeGoals.length}
- AI Tasks: ${beforeTasks.length}
- AI Habits: ${beforeHabits.length}
    `);
    
    // Process entries for the user
    console.log(`⏳ Processing journal entries for user ${userId}...`);
    const result = await processAllEntriesForUser(userId, 10);
    
    console.log(`
✅ Processing complete:
- Goals created: ${result.goalsCreated} (skipped: ${result.goalsSkipped})
- Tasks created: ${result.tasksCreated} (skipped: ${result.tasksSkipped})
- Habits created: ${result.habitsCreated} (skipped: ${result.habitsSkipped})
    `);
    
    // Get updated AI suggestions counts
    const afterGoals = await storage.getAiGoalsByUserId(userId);
    const afterTasks = await storage.getAiTasksByUserId(userId);
    const afterHabits = await storage.getAiHabitsByUserId(userId);
    
    console.log(`
After processing:
- AI Goals: ${afterGoals.length} (${afterGoals.length - beforeGoals.length > 0 ? '+' : ''}${afterGoals.length - beforeGoals.length})
- AI Tasks: ${afterTasks.length} (${afterTasks.length - beforeTasks.length > 0 ? '+' : ''}${afterTasks.length - beforeTasks.length})
- AI Habits: ${afterHabits.length} (${afterHabits.length - beforeHabits.length > 0 ? '+' : ''}${afterHabits.length - beforeHabits.length})
    `);
    
    // List all AI suggestions
    console.log("📋 Current AI Goals for user:");
    for (const goal of afterGoals) {
      console.log(`- [ID: ${goal.id}] ${goal.name} - ${goal.description || 'No description'}`);
    }
    
    console.log("\n📋 Current AI Tasks for user:");
    for (const task of afterTasks) {
      console.log(`- [ID: ${task.id}] ${task.title} - Priority: ${task.priority || 'Medium'}`);
    }
    
    console.log("\n📋 Current AI Habits for user:");
    for (const habit of afterHabits) {
      console.log(`- [ID: ${habit.id}] ${habit.title} - Frequency: ${habit.frequency || 'Daily'}`);
    }
    
  } catch (error) {
    console.error("❌ Error in test script:", error);
  } finally {
    process.exit(0);
  }
}

main();