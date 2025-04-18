import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Goal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Target, PlusCircle, ChevronRight } from "lucide-react";

type GoalsHabitsProps = {
  userId: number;
};

export function GoalsHabits({ userId }: GoalsHabitsProps) {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${userId}`],
  });
  
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: number; progress: number }) => {
      const res = await apiRequest("PATCH", `/api/goals/${goalId}`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
    },
  });
  
  const colorClasses = {
    1: "bg-pink-400",
    2: "bg-blue-400",
    3: "bg-green-400",
    4: "bg-purple-400"
  };
  
  return (
    <div className="rosebud-card">
      <div className="rosebud-card-header">
        <div>
          <h2 className="rosebud-card-title">Goals & Habits</h2>
          <p className="rosebud-card-subtitle">Track your progress</p>
        </div>
        <button className="bg-primary text-white p-2 rounded-full hover:bg-primary/90">
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4 my-4">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center p-6 my-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-pink-50 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-6">
            You don't have any goals set up yet. Click the + button to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-5 my-4">
          {goals.map((goal) => {
            const progressPercent = (goal.progress / goal.target) * 100;
            
            return (
              <div key={goal.id} className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-semibold text-gray-800">{goal.name}</h3>
                  <span className="text-sm font-medium text-gray-500">
                    {goal.progress}/{goal.target} {goal.unit}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      colorClasses[goal.colorScheme as 1 | 2 | 3 | 4] || "bg-primary"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button className="w-full py-3 text-primary font-medium flex items-center justify-center">
        View All Goals <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  );
}
