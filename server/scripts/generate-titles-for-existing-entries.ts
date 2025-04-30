import { db } from "../db";
import { journalEntries } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";
import { generateJournalTitle } from "../openai";

/**
 * This script finds all journal entries without titles and generates titles for them
 * using the OpenAI API through the generateJournalTitle function.
 */
async function generateTitlesForExistingEntries() {
  try {
    console.log("Starting title generation for existing journal entries...");
    
    // Get all journal entries without titles (where title is null or empty)
    const entriesWithoutTitles = await db
      .select()
      .from(journalEntries)
      .where(
        eq(journalEntries.isJournal, true)
      );
    
    console.log(`Found ${entriesWithoutTitles.length} entries without titles.`);
    
    if (entriesWithoutTitles.length === 0) {
      console.log("No entries require title generation. Exiting.");
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each entry
    for (const entry of entriesWithoutTitles) {
      try {
        // Skip entries that already have a title
        if (entry.title) {
          console.log(`Entry ${entry.id} already has title: "${entry.title}". Skipping.`);
          continue;
        }
        
        console.log(`Generating title for entry ${entry.id}...`);
        
        // Use content or transcript (if available) for title generation
        const contentForTitle = entry.transcript || entry.content;
        
        // Generate title
        const title = await generateJournalTitle(contentForTitle);
        
        // Update the entry with the new title
        await db
          .update(journalEntries)
          .set({ title })
          .where(eq(journalEntries.id, entry.id));
        
        console.log(`Updated entry ${entry.id} with title: "${title}"`);
        successCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error);
        errorCount++;
      }
    }
    
    console.log("\nTitle generation complete!");
    console.log(`Successfully updated: ${successCount} entries`);
    console.log(`Failed: ${errorCount} entries`);
    
  } catch (error) {
    console.error("Error in generateTitlesForExistingEntries:", error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the script
generateTitlesForExistingEntries();