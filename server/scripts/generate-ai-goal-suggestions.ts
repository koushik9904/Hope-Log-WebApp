import { db } from "../db";
import { storage } from "../storage";
import { generateGoalSuggestions } from "../openai";
import { JournalEntry, Goal } from "@shared/schema";

/**
 * Script to generate AI goal suggestions for all users based on their journal entries
 * This script can be run on a schedule (e.g., weekly) to analyze journal entries
 * and generate personalized goal suggestions for each user
 */
async function generateAIGoalSuggestions() {
  try {
    console.log("Starting AI goal suggestion generation...");
    
    // Get all users
    const users = await storage.getAllUsers();
    console.log(`Found ${users.length} users to process`);
    
    for (const user of users) {
      try {
        console.log(`Processing user: ${user.id} (${user.email})`);
        
        // Get recent journal entries for this user (last 10 entries)
        const journalEntries = await storage.getRecentJournalEntriesByUserId(user.id, 10);
        
        // Filter to only include actual journal entries, not chat messages
        const filteredEntries = journalEntries.filter(entry => entry.isJournal);
        
        if (filteredEntries.length === 0) {
          console.log(`No journal entries found for user ${user.id}, skipping`);
          continue;
        }
        
        console.log(`Found ${filteredEntries.length} journal entries for user ${user.id}`);
        
        // Get existing goals to avoid duplicates
        const existingGoals = await storage.getGoalsByUserId(user.id);
        
        // Generate suggestions based on journal content
        const suggestions = await generateGoalSuggestions(filteredEntries, existingGoals);
        
        if (!suggestions.goals || suggestions.goals.length === 0) {
          console.log(`No goal suggestions generated for user ${user.id}, skipping`);
          continue;
        }
        
        console.log(`Generated ${suggestions.goals.length} goal suggestions for user ${user.id}`);
        
        // Store new suggested goals in the database
        let createdCount = 0;
        for (const suggestion of suggestions.goals) {
          // Check if a similar goal already exists by comparing names
          const similarGoalExists = existingGoals.some(
            existingGoal => existingGoal.name.toLowerCase() === suggestion.name.toLowerCase()
          );
          
          if (!similarGoalExists) {
            // Create a new goal with suggested status and ai source
            await storage.createGoal({
              userId: user.id,
              name: suggestion.name,
              description: suggestion.description || "",
              category: suggestion.category || "Personal",
              target: 100, // Default target
              status: "suggested",
              source: "ai",
              aiExplanation: suggestion.explanation || "Generated from your journal entries"
            });
            
            createdCount++;
          }
        }
        
        console.log(`Created ${createdCount} new AI goal suggestions for user ${user.id}`);
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }
    
    console.log("AI goal suggestion generation completed successfully");
  } catch (error) {
    console.error("Error generating AI goal suggestions:", error);
  }
}

// Execute the function
generateAIGoalSuggestions().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch(error => {
  console.error("Script failed:", error);
  process.exit(1);
});