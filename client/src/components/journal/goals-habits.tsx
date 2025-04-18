import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Goal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type GoalsHabitsProps = {
  userId: number;
};

export function GoalsHabits({ userId }: GoalsHabitsProps) {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals", userId],
  });
  
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: number; progress: number }) => {
      const res = await apiRequest("PATCH", `/api/goals/${goalId}`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals", userId] });
    },
  });
  
  return (
    <div className="bg-white rounded-card shadow-sm">
      <div className="p-4 border-b border-neutral-light flex justify-between items-center">
        <h2 className="text-lg font-semibold font-nunito">Goals & Habits</h2>
        <button className="text-primary hover:text-primary-dark text-sm font-medium">
          <i className="ri-add-line"></i> Add New
        </button>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-neutral-medium mb-4">
              You don't have any goals set up yet. Click 'Add New' to create one.
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const progressPercent = (goal.progress / goal.target) * 100;
            const colors = {
              1: "bg-primary",
              2: "bg-secondary",
              3: "bg-accent",
            };
            const textColors = {
              1: "text-primary",
              2: "text-secondary",
              3: "text-accent",
            };
            
            return (
              <div className="mb-4" key={goal.id}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium">{goal.name}</h3>
                  <span className={cn("text-sm", textColors[goal.colorScheme as 1 | 2 | 3] || "text-primary")}>
                    {goal.progress}/{goal.target} {goal.unit}
                  </span>
                </div>
                <div className="h-2 bg-neutral-light rounded-full">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      colors[goal.colorScheme as 1 | 2 | 3] || "bg-primary"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
        
        <Button 
          variant="outline" 
          className="w-full py-2 mt-2 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
        >
          View All Goals
        </Button>
      </div>
    </div>
  );
}
