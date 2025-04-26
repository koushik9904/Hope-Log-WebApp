import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Filter, Lightbulb, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Goal, insertTaskSchema } from '@shared/schema';
import TaskList from '@/components/goals/task-list';
import TaskForm from '@/components/goals/task-form';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Example AI-suggested tasks
const AI_SUGGESTED_TASKS = [
  {
    id: "ai-task-1",
    title: "Schedule a 30-minute walk",
    description: "Take a short walk outdoors to clear your mind and improve mood",
    priority: "medium",
    source: "Journal entries mention feeling better after being outside"
  },
  {
    id: "ai-task-2",
    title: "Call a friend you haven't spoken to recently",
    description: "Reconnect with someone important in your life",
    priority: "low",
    source: "Based on mentions of missing social connections"
  },
  {
    id: "ai-task-3",
    title: "Create a to-do list for tomorrow",
    description: "Plan your day ahead to reduce morning stress",
    priority: "medium",
    source: "Journal entries indicate feeling overwhelmed by daily responsibilities"
  },
  {
    id: "ai-task-4",
    title: "Drink a glass of water when you wake up",
    description: "Start your day with hydration",
    priority: "high",
    source: "Health recommendation based on your wellness goals"
  }
];

// Task schema for quick task creation
const quickTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  priority: z.string().default("medium"),
  userId: z.number()
});

type QuickTaskValues = z.infer<typeof quickTaskSchema>;

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [aiSuggestedTasks, setAiSuggestedTasks] = useState<typeof AI_SUGGESTED_TASKS>([]);
  const [aiSuggestedGoals, setAiSuggestedGoals] = useState<{
    id: string;
    name: string;
    description: string;
    relatedTasks: string[];
  }[]>([]);
  
  // Fetch goals for filter dropdown
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/goals/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });
  
  // Define interface for task and goal suggestions
  interface TaskSuggestion {
    name: string;
    description: string;
  }
  
  interface GoalSuggestion {
    name: string;
    description: string;
    relatedTasks: string[];
  }
  
  interface TasksSuggestionResponse {
    tasks: TaskSuggestion[];
    goalSuggestions: GoalSuggestion[];
  }

  // Fetch AI-suggested tasks
  const { 
    data: aiSuggestions, 
    isLoading: isSuggestionsLoading 
  } = useQuery<TasksSuggestionResponse>({
    queryKey: [`/api/tasks/${user?.id}/suggestions`],
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    retry: false // Don't retry since our endpoint might not exist yet
  });
  
  // Set default tasks when component mounts (only if no AI suggestions are available)
  useEffect(() => {
    if (!aiSuggestions?.tasks || aiSuggestions.tasks.length === 0) {
      setAiSuggestedTasks(AI_SUGGESTED_TASKS);
    }
  }, [aiSuggestions]);
  
  // Update AI suggested tasks and goals when data is loaded
  useEffect(() => {
    if (aiSuggestions?.tasks && aiSuggestions.tasks.length > 0) {
      const taskItems = aiSuggestions.tasks.map((item: TaskSuggestion, index: number) => ({
        id: `ai-task-${index}`,
        title: item.name,
        description: item.description,
        priority: determinePriority(item.name),
        source: "Based on your journal entries"
      }));
      
      setAiSuggestedTasks(taskItems);
    }
    
    if (aiSuggestions?.goalSuggestions && aiSuggestions.goalSuggestions.length > 0) {
      const goalItems = aiSuggestions.goalSuggestions.map((item: GoalSuggestion, index: number) => ({
        id: `ai-goal-${index}`,
        name: item.name,
        description: item.description,
        relatedTasks: item.relatedTasks
      }));
      
      setAiSuggestedGoals(goalItems);
    }
  }, [aiSuggestions]);
  
  // Helper function to determine priority
  const determinePriority = (taskName: string): string => {
    const name = taskName.toLowerCase();
    if (name.includes('urgent') || name.includes('important') || name.includes('today') || name.includes('immediately'))
      return 'high';
    if (name.includes('when you can') || name.includes('consider') || name.includes('maybe'))
      return 'low';
    return 'medium'; // Default
  };
  
  // Add suggested task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: QuickTaskValues) => {
      const response = await apiRequest('POST', '/api/tasks', task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', user?.id] });
      toast({
        title: 'Task added',
        description: 'The suggested task has been added to your tasks.',
      });
    },
    onError: (error) => {
      console.error('Failed to add task:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the task. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Add suggested goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async ({ name, description, userId, relatedTasks }: {
      name: string;
      description: string;
      userId: number;
      relatedTasks: string[];
    }) => {
      // First create the goal
      const createGoalRes = await apiRequest('POST', '/api/goals', {
        name,
        description,
        userId,
        target: 100,
        progress: 0,
        category: "Personal"
      });
      
      if (!createGoalRes.ok) {
        throw new Error('Failed to create goal');
      }
      
      const goal = await createGoalRes.json();
      
      // Then create any related tasks as part of this goal
      if (relatedTasks && relatedTasks.length > 0) {
        // Create tasks in sequence
        for (const taskName of relatedTasks) {
          await apiRequest('POST', '/api/tasks', {
            title: taskName,
            description: `Task for goal: ${name}`,
            priority: 'medium',
            userId: userId,
            goalId: goal.id
          });
        }
      }
      
      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', user?.id] });
      toast({
        title: 'Goal created',
        description: 'The suggested goal has been added with its related tasks.',
      });
    },
    onError: (error) => {
      console.error('Failed to add goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the goal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Add a suggested task to user's tasks
  const addSuggestedTask = (task: (typeof AI_SUGGESTED_TASKS)[0]) => {
    if (!user) return;
    
    addTaskMutation.mutate({
      title: task.title,
      description: task.description,
      priority: task.priority,
      userId: user.id
    });
    
    // Remove from suggestions
    setAiSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
  };
  
  // Add a suggested goal with related tasks
  const addSuggestedGoal = (goal: typeof aiSuggestedGoals[0]) => {
    if (!user) return;
    
    addGoalMutation.mutate({
      name: goal.name,
      description: goal.description,
      userId: user.id,
      relatedTasks: goal.relatedTasks
    });
    
    // Remove from suggestions
    setAiSuggestedGoals(prev => prev.filter(g => g.id !== goal.id));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container p-4 mx-auto">
      <PageHeader
        title="Tasks"
        description="Manage your tasks and track your daily progress"
        className="mb-8"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter by Goal
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Select a Goal</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedGoalId(null)}>
                All Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedGoalId(0)}>
                Tasks without goal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {goals.map((goal) => (
                <DropdownMenuItem key={goal.id} onClick={() => setSelectedGoalId(goal.id)}>
                  {goal.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* AI-suggested section with tabs for tasks and goals */}
      {(aiSuggestedTasks.length > 0 || aiSuggestedGoals.length > 0) && (
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#B6CAEB]" />
              AI Suggestions
            </CardTitle>
            <CardDescription>
              Personalized suggestions based on your journal entries and wellness patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="tasks" className="relative">
                  Tasks 
                  {aiSuggestedTasks.length > 0 && (
                    <span className="ml-2 bg-[#9AAB63] text-white text-xs px-2 py-0.5 rounded-full">
                      {aiSuggestedTasks.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="goals" className="relative">
                  Goals
                  {aiSuggestedGoals.length > 0 && (
                    <span className="ml-2 bg-[#F5B8DB] text-white text-xs px-2 py-0.5 rounded-full">
                      {aiSuggestedGoals.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              {/* Task suggestions tab */}
              <TabsContent value="tasks">
                {aiSuggestedTasks.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No task suggestions available right now
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiSuggestedTasks.map(task => (
                      <div key={task.id} className="bg-[#f0f6ff] p-4 rounded-xl border border-[#B6CAEB] border-opacity-30">
                        <h4 className="font-medium text-gray-800 mb-2">{task.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        <div className="text-xs text-gray-500 italic mb-3">
                          <Lightbulb className="h-3 w-3 inline mr-1" />
                          {task.source}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={`${
                            task.priority === 'high' 
                              ? 'bg-red-100 text-red-700' 
                              : task.priority === 'low' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                          }`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                          </Badge>
                          <div className="flex-1"></div>
                          <Button 
                            onClick={() => addSuggestedTask(task)}
                            className="bg-[#9AAB63] hover:bg-[#8a9a58] text-white text-xs px-3"
                            size="sm"
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" /> Add Task
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setAiSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
                            }}
                            className="text-gray-500 text-xs px-2 border-gray-300 bg-white"
                            size="sm"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Goal suggestions tab */}
              <TabsContent value="goals">
                {aiSuggestedGoals.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No goal suggestions available right now
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiSuggestedGoals.map(goal => (
                      <div key={goal.id} className="bg-[#fff8f9] p-5 rounded-xl border border-[#F5B8DB] border-opacity-30">
                        <h4 className="font-medium text-gray-800 text-lg mb-3">{goal.name}</h4>
                        <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                        
                        {goal.relatedTasks && goal.relatedTasks.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Related Tasks:</h5>
                            <ul className="list-disc pl-5 space-y-1">
                              {goal.relatedTasks.map((task, i) => (
                                <li key={i} className="text-sm text-gray-600">{task}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-4">
                          <div className="text-xs text-gray-500 italic">
                            <Lightbulb className="h-3 w-3 inline mr-1" />
                            Based on your journal entries
                          </div>
                          <div className="flex-1"></div>
                          <Button 
                            onClick={() => addSuggestedGoal(goal)}
                            className="bg-[#F5B8DB] hover:bg-[#e29bc2] text-white text-xs px-3"
                            size="sm"
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" /> Create Goal
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setAiSuggestedGoals(prev => prev.filter(g => g.id !== goal.id));
                            }}
                            className="text-gray-500 text-xs px-2 border-gray-300 bg-white"
                            size="sm"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {selectedGoalId === null
            ? 'All Tasks'
            : selectedGoalId === 0
            ? 'Tasks without Goal'
            : `Tasks for: ${goals.find((g) => g.id === selectedGoalId)?.name || 'Selected Goal'}`}
        </h2>
        <TaskList userId={user.id} selectedGoalId={selectedGoalId} />
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm userId={user.id} onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}