import { db } from "../server/db";
import { supportRequests } from "../shared/schema";

/**
 * This migration adds a support_requests table to store form submissions from the Support & Feedback page
 */
async function main() {
  console.log("Creating support_requests table...");
  
  try {
    // Create the table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        has_attachment BOOLEAN DEFAULT FALSE,
        attachment_name TEXT,
        attachment_path TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        assigned_to INTEGER REFERENCES users(id),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("✅ Successfully created support_requests table");
  } catch (error) {
    console.error("❌ Error creating support_requests table:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });