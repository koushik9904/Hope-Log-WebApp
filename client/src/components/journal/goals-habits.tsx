import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Goal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Target, PlusCircle } from "lucide-react";

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
  
  return (
    <Card className="journal-container shadow-sm card-gradient">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Goals & Habits
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add New
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground">
              You don't have any goals set up yet. Click 'Add New' to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progressPercent = (goal.progress / goal.target) * 100;
              const colorClasses = {
                1: "bg-blue-500",
                2: "bg-green-500",
                3: "bg-purple-500",
                4: "bg-amber-500"
              };
              
              return (
                <div className="space-y-1.5" key={goal.id}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">{goal.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {goal.progress}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <div className="goal-progress-bar">
                    <div 
                      className={cn(
                        "goal-progress-fill",
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
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0">
        <Button 
          variant="outline" 
          className="w-full"
        >
          View All Goals
        </Button>
      </CardFooter>
    </Card>
  );
}
