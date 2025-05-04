/**
 * This is a one-time script to process all journal entries and generate AI suggestions
 * It will:
 * 1. Mark all journal entries as unanalyzed (analyzed=false)
 * 2. Process all entries using the AI suggestion module
 * 
 * Run this script only once to populate the AI suggestions tables.
 */

import { db } from "../db";
import { journalEntries } from "@shared/schema";
import { processAllEntries } from "../ai-suggestion-module";

async function markAllEntriesAsUnanalyzed() {
  try {
    // Update all journal entries to set analyzed=false
    const result = await db
      .update(journalEntries)
      .set({ analyzed: false })
      .returning();
    
    console.log(`✅ Marked ${result.length} journal entries as unanalyzed`);
    return result.length;
  } catch (error) {
    console.error("❌ Error marking entries as unanalyzed:", error);
    throw error;
  }
}

async function processAllJournalEntries() {
  console.log("🔍 Starting one-time processing of all journal entries");
  
  try {
    // First mark all entries as unanalyzed
    const count = await markAllEntriesAsUnanalyzed();
    
    if (count === 0) {
      console.log("⚠️ No journal entries found to process");
      return;
    }
    
    console.log(`🔄 Processing ${count} journal entries - this may take some time...`);
    
    // Process all entries
    await processAllEntries(10); // Process up to 10 entries per user
    
    console.log("✅ Successfully processed all journal entries");
  } catch (error) {
    console.error("❌ Error processing all journal entries:", error);
  }
}

// Only run this if executed directly
if (require.main === module) {
  processAllJournalEntries()
    .then(() => {
      console.log("✅ Script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { processAllJournalEntries, markAllEntriesAsUnanalyzed };