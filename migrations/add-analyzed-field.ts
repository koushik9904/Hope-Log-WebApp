import { db } from "../server/db";
import { journalEntries } from "../shared/schema";
import { boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * This migration adds an 'analyzed' field to the journal_entries table
 * to track which entries have been processed by the AI suggestion module
 */
async function main() {
  try {
    console.log("Starting migration: add-analyzed-field");
    
    // Check if the column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'journal_entries' 
      AND column_name = 'analyzed'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.length === 0) {
      // Add the analyzed column to the journal_entries table
      await db.execute(sql`
        ALTER TABLE journal_entries 
        ADD COLUMN analyzed BOOLEAN DEFAULT FALSE
      `);
      
      console.log("Successfully added 'analyzed' column to journal_entries table");
    } else {
      console.log("Column 'analyzed' already exists in journal_entries table, skipping");
    }
    
    console.log("Migration completed: add-analyzed-field");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });