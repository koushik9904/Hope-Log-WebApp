import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, AlertCircle, ThumbsUp, ThumbsDown, Clock, Sparkles, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Interface for AI task suggestions
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

interface TaskAISuggestionsProps {
  existingTaskTitles: string[];
}

export default function TaskAISuggestions({ existingTaskTitles }: TaskAISuggestionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiSuggestedTasks, setAiSuggestedTasks] = useState<AISuggestedTask[]>([]);

  // Fetch AI-suggested tasks
  const { 
    data: aiSuggestions = { goals: [], tasks: [], habits: [] },
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
  } = useQuery<{ 
    goals: any[], 
    tasks: AISuggestedTask[], 
    habits: any[] 
  }>({
    queryKey: [`/api/goals/${user?.id}/ai-suggestions`],
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    refetchOnMount: true
  });
  
  // Enhanced debugging for AI suggestions
  console.log("AI Suggestions API endpoint:", `/api/goals/${user?.id}/ai-suggestions`);
  console.log("AI Suggestions data:", aiSuggestions);
  console.log("AI Tasks (initial):", aiSuggestions.tasks?.length || 0);
  console.log("Existing Task Titles:", existingTaskTitles?.length || 0);
  
  // Process AI suggestions whenever they change - DISPLAY ALL TASKS without filtering
  useEffect(() => {
    console.log("TaskAISuggestions - AI suggestions:", aiSuggestions);
    console.log("TaskAISuggestions - AI tasks length:", aiSuggestions.tasks?.length || 0);
    
    if (aiSuggestions?.tasks?.length > 0) {
      // Set ALL tasks from the AI suggestions without any filtering
      setAiSuggestedTasks(aiSuggestions.tasks);
      console.log("TaskAISuggestions - Using ALL tasks:", aiSuggestions.tasks.length);
    }
  }, [aiSuggestions]);
  
  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      console.log(`Accepting AI task with ID: ${taskId}`);
      const res = await apiRequest("POST", `/api/ai-tasks/${taskId}/accept`, {});
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error accepting AI task:", errorData);
        throw new Error(errorData.error || "Unknown error");
      }
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
  
  // Reject task mutation
  const rejectTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      console.log(`Rejecting AI task with ID: ${taskId}`);
      const res = await apiRequest("DELETE", `/api/ai-tasks/${taskId}`, {});
      
      // For DELETE endpoints that return 204 No Content, we shouldn't try to parse JSON
      if (res.status === 204) {
        console.log("Task rejected successfully (204 No Content)");
        return {};
      }
      
      try {
        const data = await res.json();
        console.log("Reject task response data:", data);
        return data;
      } catch (e) {
        console.log("No JSON response from delete endpoint (expected for 204 status)");
        return {};
      }
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
      console.error("Error rejecting task suggestion:", error);
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the task suggestion.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingSuggestions) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#B6CAEB]" />
      </div>
    );
  }
  
  if (suggestionsError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-50 rounded-full p-3 mb-3">
          <AlertCircle className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500 mb-2">Unable to fetch AI suggestions</p>
        <p className="text-xs text-gray-400 mb-4">
          There was a problem loading task suggestions. Please try again later.
        </p>
      </div>
    );
  }

  if (aiSuggestedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
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

  console.log("Rendering TaskAISuggestions with:", {
    aiSuggestedTasks,
    count: aiSuggestedTasks.length
  });
  
  return (
    <div className="space-y-4">
      {aiSuggestedTasks.slice(0, 3).map(task => {
        console.log("Rendering task item:", task);
        return (
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
                  onClick={() => addTaskMutation.mutate(task.id)}
                  variant="outline" 
                  size="sm"
                  className="h-7 px-3 flex-1 bg-[#B6CAEB] hover:bg-[#9bb8e4] border-[#B6CAEB] text-white hover:text-white text-center justify-center"
                  disabled={addTaskMutation.isPending}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">Accept</span>
                </Button>
                <Button 
                  onClick={() => rejectTaskMutation.mutate(task.id)}
                  variant="outline" 
                  size="sm"
                  className="h-7 px-3 flex-1 border-gray-300 text-gray-500 hover:bg-gray-100 text-center justify-center"
                  disabled={rejectTaskMutation.isPending}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  <span className="text-xs">Reject</span>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}