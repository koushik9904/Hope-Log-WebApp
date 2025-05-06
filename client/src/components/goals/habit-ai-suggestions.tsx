import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, AlertCircle, ThumbsUp, ThumbsDown, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface HabitAISuggestionsProps {
  existingHabitTitles: string[];
}

export default function HabitAISuggestions({ existingHabitTitles }: HabitAISuggestionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiSuggestedHabits, setAiSuggestedHabits] = useState<any[]>([]);

  // Fetch AI-suggested habits from the same endpoint used by AI Suggestions component
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
    console.log("HabitAISuggestions - AI suggestions:", aiSuggestions);
    console.log("HabitAISuggestions - AI habits length:", aiSuggestions.habits?.length || 0);
    
    if (aiSuggestions?.habits?.length > 0) {
      // Set all habits directly without filtering to ensure they're displayed
      // This is a temporary fix to ensure we see the habits
      setAiSuggestedHabits(aiSuggestions.habits);
      console.log("HabitAISuggestions - Using all habits:", aiSuggestions.habits.length);
    }
  }, [aiSuggestions]);
  
  // Accept habit mutation
  const acceptHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("POST", `/api/ai-habits/${habitId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit added",
        description: "Habit has been added to your list",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add habit",
        description: "There was an error adding the habit",
        variant: "destructive",
      });
    },
  });
  
  // Reject habit mutation
  const rejectHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      console.log(`Rejecting AI habit with ID: ${habitId}`);
      const res = await apiRequest("DELETE", `/api/ai-habits/${habitId}`, {});
      
      // For DELETE endpoints that return 204 No Content, we shouldn't try to parse JSON
      if (res.status === 204) {
        console.log("Habit rejected successfully (204 No Content)");
        return {};
      }
      
      try {
        const data = await res.json();
        console.log("Reject habit response data:", data);
        return data;
      } catch (e) {
        console.log("No JSON response from delete endpoint (expected for 204 status)");
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Habit rejected",
        description: "Habit suggestion has been removed",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      console.error("Error rejecting habit suggestion:", error);
      toast({
        title: "Failed to reject habit",
        description: "There was an error removing the habit suggestion",
        variant: "destructive",
      });
    },
  });

  if (isLoadingSuggestions) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#9AAB63]" />
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
          There was a problem loading habit suggestions. Please try again later.
        </p>
      </div>
    );
  }

  if (aiSuggestedHabits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-50 rounded-full p-3 mb-3">
          <Lightbulb className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500 mb-2">No habit suggestions yet</p>
        <p className="text-xs text-gray-400 mb-4">
          Write more in your journal to get AI-suggested habits
        </p>
      </div>
    );
  }

  console.log("Rendering HabitAISuggestions with:", { 
    aiSuggestedHabits, 
    count: aiSuggestedHabits.length 
  });
  
  return (
    <div className="space-y-4">
      {aiSuggestedHabits.map(habit => {
        console.log("Rendering habit item:", habit);
        return (
          <div key={habit.id} className="bg-[#f5faee] p-4 rounded-xl border border-[#9AAB63] border-opacity-30">
            <h4 className="font-medium text-gray-800 text-sm mb-1">{habit.title}</h4>
            <p className="text-xs text-gray-600 mb-3">{habit.description}</p>
            
            {habit.explanation && (
              <div className="bg-[#F5F5FF] p-2 rounded-md text-xs text-gray-600 mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="h-3 w-3 text-[#9AAB63]" />
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
                  onClick={() => acceptHabitMutation.mutate(habit.id)}
                  variant="outline" 
                  size="sm"
                  className="h-7 px-3 flex-1 bg-[#9AAB63] hover:bg-[#899a58] border-[#9AAB63] text-white hover:text-white text-center justify-center"
                  disabled={acceptHabitMutation.isPending}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">Accept</span>
                </Button>
                <Button 
                  onClick={() => rejectHabitMutation.mutate(habit.id)}
                  variant="outline" 
                  size="sm"
                  className="h-7 px-3 flex-1 border-gray-300 text-gray-500 hover:bg-gray-100 text-center justify-center"
                  disabled={rejectHabitMutation.isPending}
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