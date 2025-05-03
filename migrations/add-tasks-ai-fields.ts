import { sql } from "drizzle-orm";
import { db } from "../server/db";

/**
 * This migration adds status, source, and aiExplanation fields to the tasks table
 * to support the unified AI suggestion module
 */
async function main() {
  console.log("Running migration: add-tasks-ai-fields");

  try {
    // Add status column
    await db.execute(sql`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    `);
    console.log("Added status column to tasks table");

    // Add source column
    await db.execute(sql`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user'
    `);
    console.log("Added source column to tasks table");

    // Add aiExplanation column
    await db.execute(sql`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_explanation TEXT
    `);
    console.log("Added ai_explanation column to tasks table");

    // Update any tasks that don't have status set
    await db.execute(sql`
      UPDATE tasks 
      SET status = CASE 
        WHEN completed = true THEN 'completed' 
        ELSE 'pending' 
      END
      WHERE status IS NULL
    `);
    console.log("Updated existing tasks with status values");

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

main().catch(console.error);