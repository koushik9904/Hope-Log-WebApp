
import { storage } from '../storage';

async function migrateGoalsAndTasksToSuggestions() {
  try {
    // Get all users
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      console.log(`Processing user ${user.id}...`);
      
      // Get all goals and tasks for the user
      const goals = await storage.getGoalsByUserId(user.id);
      const tasks = await storage.getTasksByUserId(user.id);
      
      // Categorize tasks and goals based on the defined criteria
      const suggestions = {
        tasks: [] as any[],
        goalSuggestions: [] as any[]
      };

      // Process existing tasks
      for (const task of tasks) {
        // Check if this is really a task (can be completed quickly, single action)
        const isQuickTask = isTaskByDefinition(task.title, task.description);
        
        if (isQuickTask) {
          suggestions.tasks.push({
            name: task.title,
            description: task.description || `Task identified from existing data: "${task.title}"`,
            priority: task.priority || 'medium'
          });
        } else {
          // If it's not a quick task, it might be a goal
          suggestions.goalSuggestions.push({
            name: task.title,
            description: task.description || `Goal identified from task: "${task.title}"`,
            relatedTasks: []
          });
        }
      }

      // Process existing goals
      for (const goal of goals) {
        // Get related tasks for this goal
        const relatedTasks = await storage.getTasksByGoalId(goal.id);
        
        suggestions.goalSuggestions.push({
          name: goal.name,
          description: goal.description || `Goal identified from existing data: "${goal.name}"`,
          relatedTasks: relatedTasks.map(t => t.title)
        });
      }
      
      // Store suggestions
      if (suggestions.tasks.length > 0) {
        await storage.storeAiSuggestions({
          userId: user.id,
          type: 'tasks',
          suggestions: suggestions.tasks
        });
        console.log(`Migrated ${suggestions.tasks.length} tasks to suggestions for user ${user.id}`);
      }
      
      if (suggestions.goalSuggestions.length > 0) {
        await storage.storeAiSuggestions({
          userId: user.id,
          type: 'goals',
          suggestions: suggestions.goalSuggestions
        });
        console.log(`Migrated ${suggestions.goalSuggestions.length} goals to suggestions for user ${user.id}`);
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
