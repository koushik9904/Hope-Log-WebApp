import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * This migration adds a support_requests table to store form submissions from the Support & Feedback page
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Create support_requests table
  console.log('Creating support_requests table...');
  
  const supportRequestsTable = pgTable("support_requests", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    hasAttachment: boolean("has_attachment").default(false),
    attachmentName: text("attachment_name"),
    attachmentPath: text("attachment_path"),
    status: text("status").notNull().default("new"), // 'new', 'in_progress', 'resolved', 'closed'
    assignedTo: integer("assigned_to"),
    notes: text("admin_notes"),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
  });

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
        has_attachment BOOLEAN DEFAULT false,
        attachment_name TEXT,
        attachment_path TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        assigned_to INTEGER,
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Successfully created support_requests table');
  } catch (error) {
    console.error('❌ Error creating support_requests table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });