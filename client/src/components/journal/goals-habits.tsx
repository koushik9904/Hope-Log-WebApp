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
    1: "bg-[#F5B8DB]",
    2: "bg-[#B6CAEB]",
    3: "bg-[#9AAB63]",
    4: "bg-[#F5D867]"
  };
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Goals & Habits</h2>
          <p className="text-sm text-gray-500">Track your progress</p>
        </div>
        <button className="bg-[#9AAB63] text-white p-2 rounded-full hover:bg-[#9AAB63]/90 transition-colors">
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
          <div className="w-20 h-20 mx-auto rounded-full bg-[#9AAB63]/10 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-[#9AAB63]" />
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
              <div key={goal.id} className="bg-[#FFF8E8] p-4 rounded-2xl border border-gray-100">
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
                      colorClasses[goal.colorScheme as 1 | 2 | 3 | 4] || "bg-[#9AAB63]"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button className="w-full py-3 text-[#9AAB63] font-medium flex items-center justify-center hover:text-[#9AAB63]/80 transition-colors">
        View All Goals <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  );
}
