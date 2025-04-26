import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to update specific users with real email addresses
 */
async function updateUserEmails() {
  try {
    console.log("Starting user email updates...");
    
    // Map of usernames to their real email addresses
    const emailUpdates = {
      "jazeeljabbar": "jazeeljabbar@gmail.com",
      "jazeel28": "jazeel28@hotmail.com",
      "admin": "jazeel@hopelog.com",
    };

    // Update each user in the map
    for (const [username, email] of Object.entries(emailUpdates)) {
      // Find the user
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (user) {
        // Update the email
        await db.update(users)
          .set({ email })
          .where(eq(users.id, user.id));
        
        console.log(`Updated user ${username} (ID: ${user.id}) with email: ${email}`);
      } else {
        console.log(`User ${username} not found`);
      }
    }
    
    console.log("Email updates complete");
  } catch (error) {
    console.error("Error updating user emails:", error);
  }
}

// Run the updates
updateUserEmails().catch(console.error);