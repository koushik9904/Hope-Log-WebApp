import { db } from "../db";
import { journalEntries } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { generateJournalTitle } from "../openai";

/**
 * Script to generate titles for all existing journal entries that don't have titles
 * This is a one-time process to be run after adding the title field to the journal_entries table
 */
async function generateTitlesForExistingEntries() {
  try {
    // Get all entries that don't have titles
    // Look for user messages (not AI responses) that don't have a title yet
    const entriesWithoutTitles = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          isNull(journalEntries.title),
          eq(journalEntries.isAiResponse, false)
        )
      );
    
    console.log(`Found ${entriesWithoutTitles.length} entries that might need titles.`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each entry
    for (const entry of entriesWithoutTitles) {
      try {
        // Skip entries that already have a title
        if (entry.title) {
          console.log(`Entry ${entry.id} already has title: "${entry.title}". Skipping.`);
          skippedCount++;
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
    
    console.log("Title generation complete!");
    console.log("Stats:");
    console.log(`  Total journal entries: ${entriesWithoutTitles.length}`);
    console.log(`  Titles generated: ${successCount}`);
    console.log(`  Entries skipped (already had titles): ${skippedCount}`);
    console.log(`  Failed entries: ${errorCount}`);
    
  } catch (error) {
    console.error("Error generating titles for journal entries:", error);
  }
}

// Run the script
generateTitlesForExistingEntries()
  .then(() => {
    console.log("Script execution completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
  });