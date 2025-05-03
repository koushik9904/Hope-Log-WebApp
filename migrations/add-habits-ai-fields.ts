import { sql } from "drizzle-orm";
import { db } from "../server/db";

/**
 * This migration adds status, source, and aiExplanation fields to the habits table
 * to support the unified AI suggestion module
 */
async function main() {
  console.log("Running migration: add-habits-ai-fields");

  try {
    // Add status column
    await db.execute(sql`
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    `);
    console.log("Added status column to habits table");

    // Add source column
    await db.execute(sql`
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user'
    `);
    console.log("Added source column to habits table");

    // Add aiExplanation column
    await db.execute(sql`
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS ai_explanation TEXT
    `);
    console.log("Added ai_explanation column to habits table");

    // Update any habits that don't have status set
    await db.execute(sql`
      UPDATE habits 
      SET status = 'active'
      WHERE status IS NULL
    `);
    console.log("Updated existing habits with status values");

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

main().catch(console.error);