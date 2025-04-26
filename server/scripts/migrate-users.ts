import { db } from "../db";
import { users } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Migration script to update existing users:
 * 1. Ensures all users have valid email addresses
 * 2. Marks existing users as verified
 */
async function migrateUsers() {
  try {
    console.log("Starting user migration...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to process`);
    
    let updatedCount = 0;
    
    for (const user of allUsers) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Ensure the user has a valid email address
      if (!user.email || user.email.trim() === '') {
        // If email is missing, use username + placeholder domain
        updates.email = `${user.username}@placeholder.com`;
        needsUpdate = true;
        console.log(`Adding placeholder email for user ${user.id}: ${user.username}`);
      }
      
      // Mark existing users as verified if not already
      if (user.isVerified === false || user.isVerified === null) {
        updates.isVerified = true;
        needsUpdate = true;
        console.log(`Marking user ${user.id}: ${user.username} as verified`);
      }
      
      // Update the user if needed
      if (needsUpdate) {
        await db.update(users)
          .set(updates)
          .where(eq(users.id, user.id));
        updatedCount++;
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error("Error during user migration:", error);
  }
}

// Run the migration
migrateUsers().catch(console.error);