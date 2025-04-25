import { apiRequest } from "@/lib/queryClient";
import { InsertNotification } from "@shared/schema";

// Function to create a new notification
export async function createNotification(notification: Omit<InsertNotification, "userId">) {
  try {
    const response = await apiRequest("POST", "/api/notifications", notification);
    return await response.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Create a journal reminder notification
export async function createJournalReminder() {
  return createNotification({
    title: "Time to journal",
    message: "Take a moment to reflect on your day and write in your journal.",
    type: "reminder",
    status: "unread",
    isRecurring: false
  });
}

// Create a goal completion notification
export async function createGoalCompletionNotification(goalName: string) {
  return createNotification({
    title: "Goal completed! 🎉",
    message: `Congratulations! You've completed your goal: "${goalName}"`,
    type: "goal",
    status: "unread",
    isRecurring: false
  });
}

// Create a streak notification
export async function createStreakNotification(days: number) {
  return createNotification({
    title: `${days} day streak! 🔥`,
    message: `You've maintained your journaling habit for ${days} days! Keep it up!`,
    type: "streak",
    status: "unread",
    isRecurring: false
  });
}

// Create a weekly summary notification
export async function createWeeklySummaryNotification() {
  return createNotification({
    title: "Your weekly summary is ready",
    message: "Check out your progress and insights from the past week.",
    type: "system",
    status: "unread",
    isRecurring: false
  });
}

// Create a welcome notification
export async function createWelcomeNotification() {
  return createNotification({
    title: "Welcome to Hope Log! 👋",
    message: "Start your mental wellness journey by creating your first journal entry.",
    type: "system",
    status: "unread",
    isRecurring: false
  });
}

// Create a test notification for each type (for testing purposes)
export async function createTestNotifications() {
  try {
    await createJournalReminder();
    await createGoalCompletionNotification("Learn to meditate");
    await createStreakNotification(7);
    await createWeeklySummaryNotification();
    return true;
  } catch (error) {
    console.error("Error creating test notifications:", error);
    return false;
  }
}