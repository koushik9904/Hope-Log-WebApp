import { db } from "../db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { goals } from "@shared/schema";

async function main() {
  try {
    // Get a sample user ID
    const result = await db.query.goals.findFirst();
    if (!result) {
      console.log("No goals found in the database");
      return;
    }

    const userId = result.userId;
    console.log(`Found user ID: ${userId}. Testing fixes...`);

    // Check if any goals have a non-null deletedAt field
    const deletedGoals = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          sql`${goals.deletedAt} IS NOT NULL`
        )
      );
    console.log(`Found ${deletedGoals.length} deleted goals for user ${userId}`);

    // Check if the regular getGoalsByUserId is correctly filtering out deleted goals
    const activeGoals = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          isNull(goals.deletedAt)
        )
      );
    console.log(`Found ${activeGoals.length} active (non-deleted) goals for user ${userId}`);

    // List the first few goals to inspect their deletedAt status
    console.log("\nSample of goals (showing at most 3):");
    const allGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .limit(3);
    
    for (const goal of allGoals) {
      console.log(
        `ID: ${goal.id}, Name: ${goal.name}, Deleted: ${goal.deletedAt ? "Yes" : "No"}, DeletedAt: ${goal.deletedAt}`
      );
    }
    
    console.log("\nBased on these results, run the following SQL query to properly filter deleted goals:");
    console.log(`
SELECT * FROM goals 
WHERE user_id = ${userId} 
  AND deleted_at IS NULL
ORDER BY id DESC;
    `);
    
  } catch (error) {
    console.error("Error running script:", error);
  }
}

main();