import { db } from "../db";
import { storage } from "../storage";
import { generateGoalSuggestions } from "../openai";

/**
 * Test script to generate AI goal suggestions for a specific user
 * Run this script with: npx tsx server/scripts/test-goal-suggestions.ts USER_ID
 */
async function testGoalSuggestions() {
  try {
    // Get user ID from command line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error("Please provide a user ID as a command line argument");
      process.exit(1);
    }
    
    const userId = parseInt(args[0], 10);
    if (isNaN(userId)) {
      console.error("Invalid user ID. Please provide a valid number.");
      process.exit(1);
    }
    
    console.log(`Testing AI goal suggestions for user ID: ${userId}`);
    
    // Get user to make sure they exist
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Get recent journal entries for this user
    const journalEntries = await storage.getRecentJournalEntriesByUserId(userId, 10);
    
    // Filter to only include actual journal entries, not chat messages
    const filteredEntries = journalEntries.filter(entry => entry.isJournal);
    
    if (filteredEntries.length === 0) {
      console.error(`No journal entries found for user ${userId}`);
      process.exit(1);
    }
    
    console.log(`Found ${filteredEntries.length} journal entries for analysis`);
    
    // Get existing goals to avoid duplicates
    const existingGoals = await storage.getGoalsByUserId(userId);
    console.log(`User has ${existingGoals.length} existing goals`);
    
    // Generate suggestions based on journal content
    console.log("Generating AI goal suggestions...");
    const suggestions = await generateGoalSuggestions(filteredEntries, existingGoals);
    
    console.log("\n===== GENERATED GOAL SUGGESTIONS =====");
    console.log(JSON.stringify(suggestions, null, 2));
    
    // See if any of these goals would be duplicates
    if (suggestions.goals && suggestions.goals.length > 0) {
      console.log("\n===== DUPLICATE CHECK =====");
      for (const suggestion of suggestions.goals) {
        const similarGoalExists = existingGoals.some(
          existingGoal => existingGoal.name.toLowerCase() === suggestion.name.toLowerCase()
        );
        
        console.log(`"${suggestion.name}": ${similarGoalExists ? "DUPLICATE" : "NEW"}`);
      }
    }
    
    console.log("\nTest completed successfully");
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Execute the function
testGoalSuggestions().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch(error => {
  console.error("Script failed:", error);
  process.exit(1);
});