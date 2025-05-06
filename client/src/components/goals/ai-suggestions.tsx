import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Target, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  Lightbulb, 
  ListChecks, 
  Loader2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

// Interfaces for AI suggestions
interface AISuggestedGoal {
  id: number;
  name: string;
  description: string | null;
  category?: string;
  targetDate?: string | null;
  journalEntryId?: number;
  explanation?: string;
  userId: number;
  createdAt: string;
}

interface AISuggestedTask {
  id: number;
  title: string;
  description: string | null;
  priority?: string;
  goalId?: number | null;
  journalEntryId?: number;
  explanation?: string;
  createdAt: string;
  userId: number;
  dueDate?: string | null;
}

interface AISuggestedHabit {
  id: number;
  title: string;
  description: string | null;
  frequency?: string;
  journalEntryId?: number;
  explanation?: string;
  createdAt: string;
  userId: number;
}

// Interface for existing items to filter duplicates
interface Goal {
  id: number;
  name: string;
  description?: string | null;
}

interface Task {
  id: number;
  title: string;
  description?: string | null;
}

interface Habit {
  id: number;
  title: string;
  description?: string | null;
}

interface AISuggestionsProps {
  existingGoals: Goal[];
  existingTasks: Task[];
  existingHabits: Habit[];
  activeTab: string;
}

export default function AISuggestions({ existingGoals, existingTasks, existingHabits, activeTab }: AISuggestionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch AI-suggested goals, tasks and habits
  const { data: aiSuggestions = { goals: [], tasks: [], habits: [] }, 
          isLoading: isSuggestionsLoading,
          error: suggestionsError
        } = useQuery<{ 
          goals: AISuggestedGoal[], 
          tasks: AISuggestedTask[], 
          habits: AISuggestedHabit[] 
        }>({
    queryKey: [`/api/goals/${user?.id}/ai-suggestions`],
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    refetchOnMount: true
  });
  
  // Log data for debugging
  console.log("Active Tab:", activeTab);
  console.log("AI Suggestions data:", aiSuggestions);
  
  // Accept/reject mutations
  const acceptGoalSuggestionMutation = useMutation({
    mutationFn: async (goalId: number) => {
      console.log(`Accepting AI goal with ID: ${goalId}`);
      const res = await apiRequest("POST", `/api/ai-goals/${goalId}/accept`, {});
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error accepting AI goal:", errorData);
        throw new Error(errorData.error || "Unknown error");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Goal added successfully",
        description: "The suggested goal has been added to your goals.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add goal",
        description: "There was an error adding the suggested goal.",
        variant: "destructive",
      });
    },
  });

  const rejectGoalSuggestionMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-goals/${goalId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion removed",
        description: "The goal suggestion has been removed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the goal suggestion.",
        variant: "destructive",
      });
    },
  });
  
  const acceptTaskSuggestionMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/ai-tasks/${taskId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task added successfully",
        description: "The suggested task has been added to your tasks.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add task",
        description: "There was an error adding the suggested task.",
        variant: "destructive",
      });
    },
  });

  const rejectTaskSuggestionMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-tasks/${taskId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion removed",
        description: "The task suggestion has been removed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the task suggestion.",
        variant: "destructive",
      });
    },
  });
  
  const acceptHabitSuggestionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("POST", `/api/ai-habits/${habitId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit added successfully",
        description: "The suggested habit has been added to your habits.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add habit",
        description: "There was an error adding the suggested habit.",
        variant: "destructive",
      });
    },
  });

  const rejectHabitSuggestionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-habits/${habitId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion removed",
        description: "The habit suggestion has been removed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the habit suggestion.",
        variant: "destructive",
      });
    },
  });

  // Filter out AI suggestions that are already in the main lists
  const aiSuggestedGoals = (aiSuggestions.goals || []).filter(suggestion => 
    !existingGoals.some(goal => 
      goal.name.toLowerCase() === suggestion.name.toLowerCase() ||
      goal.name.toLowerCase().includes(suggestion.name.toLowerCase()) ||
      suggestion.name.toLowerCase().includes(goal.name.toLowerCase())
    )
  );
  
  const aiSuggestedTasks = (aiSuggestions.tasks || []).filter(suggestion => 
    !existingTasks.some(task => 
      task.title.toLowerCase() === suggestion.title.toLowerCase() ||
      task.title.toLowerCase().includes(suggestion.title.toLowerCase()) ||
      suggestion.title.toLowerCase().includes(task.title.toLowerCase())
    )
  );
  
  const aiSuggestedHabits = (aiSuggestions.habits || []).filter(suggestion => 
    !existingHabits.some(habit => 
      habit.title.toLowerCase() === suggestion.title.toLowerCase() ||
      habit.title.toLowerCase().includes(suggestion.title.toLowerCase()) ||
      suggestion.title.toLowerCase().includes(habit.title.toLowerCase())
    )
  );
  
  // Render content based on active tab
  const renderContent = () => {
    if (isSuggestionsLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#F5B8DB]" />
        </div>
      );
    }
    
    if (suggestionsError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-gray-50 rounded-full p-3 mb-3">
            <AlertCircle className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mb-2">Unable to fetch AI suggestions</p>
          <p className="text-xs text-gray-400 mb-4">
            There was a problem loading suggestions. Please try again later.
          </p>
        </div>
      );
    }
    
    if (activeTab === "goals") {
      if (aiSuggestedGoals.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-gray-50 rounded-full p-3 mb-3">
              <Lightbulb className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-2">No goal suggestions yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Write more in your journal to get AI-suggested goals
            </p>
          </div>
        );
      }
      
      return (
        <div className="space-y-4">
          {aiSuggestedGoals.slice(0, 3).map(goal => (
            <div key={goal.id} className="bg-[#fff8f9] p-4 rounded-xl border border-[#F5B8DB] border-opacity-30">
              <h4 className="font-medium text-gray-800 text-sm mb-1">{goal.name}</h4>
              <p className="text-xs text-gray-600 mb-3">{goal.description}</p>
              
              {goal.explanation && (
                <div className="bg-[#F5F5FF] p-2 rounded-md text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-[#B6CAEB]" />
                    <span className="font-medium text-gray-700">Why this was suggested:</span>
                  </div>
                  {goal.explanation}
                </div>
              )}
              
              <div className="mt-3">
                {/* Category badge */}
                <div className="mb-3 text-xs text-gray-500 flex items-center">
                  <Lightbulb className="h-3 w-3 inline mr-1 text-[#9AAB63]" />
                  {goal.category || "Personal"}
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 justify-center w-full">
                  <Button 
                    onClick={() => acceptGoalSuggestionMutation.mutate(goal.id)}
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 flex-1 bg-[#F5B8DB] hover:bg-[#f096c9] border-[#F5B8DB] text-white hover:text-white text-center justify-center"
                    disabled={acceptGoalSuggestionMutation.isPending}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    <span className="text-xs">Accept</span>
                  </Button>
                  <Button 
                    onClick={() => rejectGoalSuggestionMutation.mutate(goal.id)}
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 flex-1 border-gray-300 text-gray-500 hover:bg-gray-100 text-center justify-center"
                    disabled={rejectGoalSuggestionMutation.isPending}
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    <span className="text-xs">Reject</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (activeTab === "tasks") {
      if (aiSuggestedTasks.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-gray-50 rounded-full p-3 mb-3">
              <ListChecks className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-2">No task suggestions yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Write more in your journal to get AI-suggested tasks
            </p>
          </div>
        );
      }
      
      return (
        <div className="space-y-4">
          {aiSuggestedTasks.slice(0, 3).map(task => (
            <div key={task.id} className="bg-[#f5f8ff] p-4 rounded-xl border border-[#B6CAEB] border-opacity-30">
              <h4 className="font-medium text-gray-800 text-sm mb-1">{task.title}</h4>
              <p className="text-xs text-gray-600 mb-3">{task.description}</p>
              
              {task.explanation && (
                <div className="bg-[#F5F5FF] p-2 rounded-md text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-[#B6CAEB]" />
                    <span className="font-medium text-gray-700">Why this was suggested:</span>
                  </div>
                  {task.explanation}
                </div>
              )}
              
              <div className="mt-3">
                {/* Priority badge */}
                <div className="mb-3 text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 inline mr-1 text-[#B6CAEB]" />
                  {task.priority || "Medium"} Priority
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 justify-center w-full">
                  <Button 
                    onClick={() => acceptTaskSuggestionMutation.mutate(task.id)}
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 flex-1 bg-[#B6CAEB] hover:bg-[#9bb8e4] border-[#B6CAEB] text-white hover:text-white text-center justify-center"
                    disabled={acceptTaskSuggestionMutation.isPending}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    <span className="text-xs">Accept</span>
                  </Button>
                  <Button 
                    onClick={() => rejectTaskSuggestionMutation.mutate(task.id)}
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 flex-1 border-gray-300 text-gray-500 hover:bg-gray-100 text-center justify-center"
                    disabled={rejectTaskSuggestionMutation.isPending}
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    <span className="text-xs">Reject</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (activeTab === "habits") {
      if (aiSuggestedHabits.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-gray-50 rounded-full p-3 mb-3">
              <Target className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-2">No habit suggestions yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Write more in your journal to get AI-suggested habits
            </p>
          </div>
        );
      }
      
      return (
        <div className="space-y-4">
          {aiSuggestedHabits.slice(0, 3).map(habit => (
            <div key={habit.id} className="bg-[#f5faee] p-4 rounded-xl border border-[#9AAB63] border-opacity-30">
              <h4 className="font-medium text-gray-800 text-sm mb-1">{habit.title}</h4>
              <p className="text-xs text-gray-600 mb-3">{habit.description}</p>
              
              {habit.explanation && (
                <div className="bg-[#F5F5FF] p-2 rounded-md text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-[#B6CAEB]" />
                    <span className="font-medium text-gray-700">Why this was suggested:</span>
                  </div>
                  {habit.explanation}
                </div>
              )}
              
              <div className="mt-3">
                {/* Frequency badge */}
                <div className="mb-3 text-xs text-gray-500 flex items-center">
                  <Target className="h-3 w-3 inline mr-1 text-[#9AAB63]" />
                  {habit.frequency || "Daily"} Habit
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 justify-center w-full">
                  <Button 
                    onClick={() => acceptHabitSuggestionMutation.mutate(habit.id)}
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 flex-1 bg-[#9AAB63] hover:bg-[#899a58] border-[#9AAB63] text-white hover:text-white text-center justify-center"
                    disabled={acceptHabitSuggestionMutation.isPending}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    <span className="text-xs">Accept</span>
                  </Button>
                  <Button 
                    onClick={() => rejectHabitSuggestionMutation.mutate(habit.id)}
                    variant="outline" 
                    size="sm"
                    className="h-7 px-3 flex-1 border-gray-300 text-gray-500 hover:bg-gray-100 text-center justify-center"
                    disabled={rejectHabitSuggestionMutation.isPending}
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    <span className="text-xs">Reject</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center p-4 text-center text-gray-500">
        Select a category to see suggestions
      </div>
    );
  };

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-['Montserrat_Variable'] text-lg">
          <span>AI Suggestions</span>
        </CardTitle>
        <CardDescription>
          AI suggestions based on your journal entries
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}