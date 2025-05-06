import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, AlertCircle, ThumbsUp, ThumbsDown, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface TaskAISuggestionsProps {
  existingTaskTitles: string[];
}

export default function TaskAISuggestions({ existingTaskTitles }: TaskAISuggestionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiSuggestedTasks, setAiSuggestedTasks] = useState<any[]>([]);

  // Fetch AI-suggested tasks from the same endpoint used by AI Suggestions component
  const { 
    data: aiSuggestions = { goals: [], tasks: [], habits: [] },
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
  } = useQuery<{ 
    goals: any[], 
    tasks: any[], 
    habits: any[] 
  }>({
    queryKey: [`/api/goals/${user?.id}/ai-suggestions`],
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
  
  // Process AI suggestions whenever they change
  useEffect(() => {
    console.log("TaskAISuggestions - AI suggestions:", aiSuggestions);
    console.log("TaskAISuggestions - AI tasks length:", aiSuggestions.tasks?.length || 0);
    
    if (aiSuggestions?.tasks?.length > 0) {
      // Set all tasks directly without filtering to ensure they're displayed
      // This is a temporary fix to ensure we see the tasks
      setAiSuggestedTasks(aiSuggestions.tasks);
      console.log("TaskAISuggestions - Using all tasks:", aiSuggestions.tasks.length);
    }
  }, [aiSuggestions]);
  
  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const res = await apiRequest("POST", `/api/ai-tasks/${task.id}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task added",
        description: "Task has been added to your list",
        variant: "default",
      });
      // Invalidate queries to refresh the tasks list and AI suggestions
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add task",
        description: "There was an error adding the task",
        variant: "destructive",
      });
    },
  });
  
  // Reject task mutation
  const rejectTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-tasks/${taskId}`, {});
      
      // For DELETE endpoints that return 204 No Content, we shouldn't try to parse JSON
      if (res.status === 204) {
        return {};
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task rejected",
        description: "Task suggestion has been removed",
        variant: "default",
      });
      // Refresh AI suggestions after rejection
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject task",
        description: "There was an error removing the task suggestion",
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
          <Lightbulb className="h-6 w-6 text-gray-300" />
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
    count: aiSuggestedTasks.length,
    originalTasksCount: aiSuggestions.tasks?.length
  });
  
  return (
    <div className="space-y-4">
      {aiSuggestedTasks.map(task => {
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
                  onClick={() => addTaskMutation.mutate(task)}
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