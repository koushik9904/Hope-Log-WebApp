import { and, eq, isNull, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { goals, tasks, habits } from "@shared/schema";

// These are the corrected functions we need to apply to storage.ts

export const fixGoalsGetterFunction = `
async getGoalsByUserId(userId: number): Promise<Goal[]> {
  return await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, userId),
        isNull(goals.deletedAt)
      )
    )
    .orderBy(desc(goals.id));
}
`;

export const fixGetDeletedTasksFunction = `
async getDeletedTasksByUserId(userId: number): Promise<Task[]> {
  return await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        sql\`\${tasks.deletedAt} IS NOT NULL\`
      )
    )
    .orderBy(desc(tasks.id));
}
`;

export const fixRestoreTaskFunction = `
async restoreTask(id: number): Promise<Task> {
  const result = await db
    .update(tasks)
    .set({ deletedAt: null })
    .where(eq(tasks.id, id))
    .returning();
  return result[0];
}
`;

export const fixGetDeletedGoalsFunction = `
async getDeletedGoalsByUserId(userId: number): Promise<Goal[]> {
  return await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.userId, userId),
        sql\`\${goals.deletedAt} IS NOT NULL\`
      )
    )
    .orderBy(desc(goals.id));
}
`;

export const fixRestoreGoalFunction = `
async restoreGoal(id: number): Promise<Goal> {
  const result = await db
    .update(goals)
    .set({ deletedAt: null })
    .where(eq(goals.id, id))
    .returning();
  return result[0];
}
`;