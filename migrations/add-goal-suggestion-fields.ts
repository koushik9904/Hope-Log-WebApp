import { db } from "../server/db";
import { goals } from "../shared/schema";
import { sql } from "drizzle-orm";

async function migrateGoalTable() {
  try {
    console.log("Starting migration to add suggestion fields to goals table");
    
    // Add source column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'goals' AND column_name = 'source'
        ) THEN
          ALTER TABLE goals ADD COLUMN source TEXT DEFAULT 'user';
        END IF;
      END $$;
    `);
    console.log("Added 'source' column to goals table");
    
    // Add AI explanation column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'goals' AND column_name = 'ai_explanation'
        ) THEN
          ALTER TABLE goals ADD COLUMN ai_explanation TEXT;
        END IF;
      END $$;
    `);
    console.log("Added 'ai_explanation' column to goals table");
    
    // Update status constraints
    await db.execute(sql`
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;
      ALTER TABLE goals ADD CONSTRAINT goals_status_check 
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled', 'suggested'));
    `);
    console.log("Updated status constraints to include 'suggested' status");
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error executing migration:", error);
  }
}

// Execute the migration
migrateGoalTable().then(() => {
  console.log("Migration script completed");
  process.exit(0);
}).catch(error => {
  console.error("Migration script failed:", error);
  process.exit(1);
});