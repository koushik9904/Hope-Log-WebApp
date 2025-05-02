import { storage } from '../storage';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrateGoalsAndTasksToSuggestions() {
  try {
    // Drop existing suggestion tables to start fresh
    await db.execute(sql`
      DROP TABLE IF EXISTS ai_task_suggestions;
      DROP TABLE IF EXISTS ai_goal_suggestions;

      CREATE TABLE IF NOT EXISTS ai_task_suggestions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_goal_suggestions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get all users
    const users = await storage.getAllUsers();

    for (const user of users) {
      console.log(`Processing user ${user.id}...`);

      // Get all goals and tasks for the user
      const goals = await storage.getGoalsByUserId(user.id);
      const tasks = await storage.getTasksByUserId(user.id);

      // First add some default suggestions for each user
      const defaultTaskSuggestions = [
        {
          name: "Schedule a 30-minute walk",
          description: "Take a short walk outdoors to clear your mind and improve mood",
          priority: "medium"
        },
        {
          name: "Create a to-do list for tomorrow",
          description: "Plan your day ahead to reduce morning stress",
          priority: "medium"
        }
      ];

      const defaultGoalSuggestions = [
        {
          name: "Improve sleep quality",
          description: "Focus on better sleep habits to improve overall wellbeing"
        },
        {
          name: "Practice daily mindfulness",
          description: "Regular mindfulness practice to manage stress levels"
        }
      ];

      // Insert default task suggestions
      await db.transaction(async (tx) => {
        for (const task of defaultTaskSuggestions) {
          await tx.execute(
            sql`INSERT INTO ai_task_suggestions (user_id, name, description, priority) 
                VALUES (${user.id}, ${task.name}, ${task.description}, ${task.priority})`
          );
        }
      });

      // Insert default goal suggestions
      await db.transaction(async (tx) => {
        for (const goal of defaultGoalSuggestions) {
          await tx.execute(
            sql`INSERT INTO ai_goal_suggestions (user_id, name, description) 
                VALUES (${user.id}, ${goal.name}, ${goal.description})`
          );
        }
      });

      // Categorize tasks and goals based on the defined criteria
      const suggestions = {
        tasks: [] as any[],
        goalSuggestions: [] as any[]
      };

      // Helper function to determine if something is a task by analyzing its name and description
      const isTaskByAnalysis = (name: string, description?: string | null): boolean => {
        const text = `${name} ${description || ''}`.toLowerCase();
        
        // Keywords that suggest a task (quick, single action items)
        const taskKeywords = [
          'call', 'email', 'write', 'book', 'buy', 'schedule', 'attend',
          'review', 'send', 'create', 'make', 'post', 'update', 'check',
          'today', 'tomorrow', 'meeting', 'appointment', 'deadline'
        ];

        // Keywords that suggest a goal (longer-term, aspirational)
        const goalKeywords = [
          'learn', 'master', 'improve', 'develop', 'build', 'achieve',
          'monthly', 'yearly', 'long-term', 'strategy', 'plan',
          'become', 'grow', 'establish', 'transform'
        ];

        const taskMatches = taskKeywords.filter(keyword => text.includes(keyword)).length;
        const goalMatches = goalKeywords.filter(keyword => text.includes(keyword)).length;

        return taskMatches > goalMatches;
      };

      // Process existing goals and categorize them
      for (const goal of goals) {
        if (isTaskByAnalysis(goal.name, goal.description)) {
          // This "goal" is actually more like a task
          await db.execute(
            sql`INSERT INTO ai_task_suggestions (user_id, name, description, priority) 
                VALUES (${goal.userId}, ${goal.name}, ${goal.description || ''}, 'medium')`
          );
        } else {
          // This is a proper goal
          await db.execute(
            sql`INSERT INTO ai_goal_suggestions (user_id, name, description) 
                VALUES (${goal.userId}, ${goal.name}, ${goal.description || ''})`
          );
        }
      }

      // Move all existing tasks to task suggestions
      for (const task of tasks) {
        await db.execute(
          sql`INSERT INTO ai_task_suggestions (user_id, name, description, priority) 
              VALUES (${task.userId}, ${task.title}, ${task.description || ''}, ${task.priority || 'medium'})`
        );
      }


      // Store suggestions
      if (suggestions.tasks.length > 0) {
        const tasksValues = suggestions.tasks.map(task => ({
          user_id: user.id,
          name: task.name,
          description: task.description
        }));

        await db.transaction(async (tx) => {
          for (const task of tasksValues) {
            await tx.execute(
              sql`INSERT INTO ai_task_suggestions (user_id, name, description) VALUES (${task.user_id}, ${task.name}, ${task.description || ''})`
            );
          }
        });
      }

      if (suggestions.goalSuggestions.length > 0) {
        const goalsValues = suggestions.goalSuggestions.map(goal => ({
          user_id: user.id,
          name: goal.name,
          description: goal.description
        }));

        await db.transaction(async (tx) => {
          for (const goal of goalsValues) {
            await tx.execute(
              sql`INSERT INTO ai_goal_suggestions (user_id, name, description) VALUES (${goal.user_id}, ${goal.name}, ${goal.description || ''})`
            );
          }
        });
      }

    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Helper function to determine if something is a task by the defined criteria
function isTaskByDefinition(title: string, description?: string): boolean {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Keywords that suggest a task (quick, single action)
  const taskKeywords = [
    'call', 'email', 'write', 'book', 'buy', 'schedule', 'attend',
    'review', 'send', 'create', 'make', 'post', 'update', 'check',
    'today', 'tomorrow', 'meeting', 'appointment', 'deadline'
  ];

  // Keywords that suggest a goal (longer-term, multiple steps)
  const goalKeywords = [
    'learn', 'master', 'improve', 'develop', 'build', 'achieve',
    'monthly', 'yearly', 'long-term', 'strategy', 'plan',
    'become', 'grow', 'establish', 'transform'
  ];

  // Check if it matches more task keywords than goal keywords
  const taskMatches = taskKeywords.filter(keyword => text.includes(keyword)).length;
  const goalMatches = goalKeywords.filter(keyword => text.includes(keyword)).length;

  return taskMatches > goalMatches;
}

// Run the migration
migrateGoalsAndTasksToSuggestions()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });