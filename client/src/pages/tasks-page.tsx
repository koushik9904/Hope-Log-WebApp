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
  
  // Define interface for task suggestions
  interface TaskSuggestion {
    name: string;
    description: string;
  }
  
  interface TasksSuggestionResponse {
    tasks: TaskSuggestion[];
  }

  // Fetch AI-suggested tasks
  const { data: aiSuggestions, isLoading: isSuggestionsLoading } = useQuery<TasksSuggestionResponse>({
    queryKey: [`/api/tasks/${user?.id}/suggestions`],
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    retry: false, // Don't retry since our endpoint might not exist yet
    onSettled: () => {
      // Set default tasks on load completion
      setAiSuggestedTasks(AI_SUGGESTED_TASKS);
    }
  });
  
  // Update AI suggested tasks when data is loaded
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

      {/* AI-suggested tasks section */}
      {aiSuggestedTasks.length > 0 && (
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#B6CAEB]" />
              AI Suggested Tasks
            </CardTitle>
            <CardDescription>
              Quick tasks suggestions based on your journal entries and wellness goals
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
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