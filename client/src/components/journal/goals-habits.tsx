import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Goal, Task, Habit } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  Target, 
  PlusCircle, 
  ChevronRight, 
  Calendar, 
  CheckCircle, 
  CheckCircle2, 
  CircleSlash, 
  ClipboardList, 
  Clock,
  Filter,
  Flame
} from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type GoalsHabitsProps = {
  userId: number;
};

export function GoalsHabits({ userId }: GoalsHabitsProps) {
  const [activeTab, setActiveTab] = useState<"goals" | "habits" | "tasks">("goals");
  
  // Fetch goals, tasks, and habits data
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${userId}`],
  });
  
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${userId}`],
  });
  
  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: [`/api/habits/${userId}`],
  });
  
  // Filter completed tasks
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Update mutations
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: number; progress: number }) => {
      const res = await apiRequest("PATCH", `/api/goals/${goalId}`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
    },
  });
  
  const toggleTaskCompletionMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, { completed });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}`] });
    },
  });
  
  const toggleHabitCompletionMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/habits/${habitId}/toggle`, { completed });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${userId}`] });
    },
  });
  
  const colorClasses = {
    1: "bg-[#F5B8DB]",
    2: "bg-[#B6CAEB]",
    3: "bg-[#9AAB63]",
    4: "bg-[#F5D867]"
  };
  
  // Simplified function to format dates consistently
  const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return "No due date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Show current month/year for the habit streak calendar
  const currentMonth = new Date().toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Goals, Habits & Tasks</h2>
          <p className="text-sm text-gray-500">Plan, track & develop positive routines</p>
        </div>
        
        {/* Add buttons vary by active tab */}
        {activeTab === "goals" && (
          <Link to="/goals#top" className="bg-[#9AAB63] text-white p-2 rounded-full hover:bg-[#9AAB63]/90 transition-colors inline-flex" onClick={() => window.scrollTo(0, 0)}>
            <PlusCircle className="h-5 w-5" />
          </Link>
        )}
        {activeTab === "tasks" && (
          <Link to="/tasks#top" className="bg-[#F5B8DB] text-white p-2 rounded-full hover:bg-[#F5B8DB]/90 transition-colors inline-flex" onClick={() => window.scrollTo(0, 0)}>
            <PlusCircle className="h-5 w-5" />
          </Link>
        )}
        {activeTab === "habits" && (
          <Link to="/habits#top" className="bg-[#B6CAEB] text-white p-2 rounded-full hover:bg-[#B6CAEB]/90 transition-colors inline-flex" onClick={() => window.scrollTo(0, 0)}>
            <PlusCircle className="h-5 w-5" />
          </Link>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as "goals" | "habits" | "tasks")}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="goals" className="data-[state=active]:bg-[#9AAB63]/20 data-[state=active]:text-[#9AAB63]">Goals</TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-[#F5B8DB]/20 data-[state=active]:text-[#F5B8DB]">Tasks</TabsTrigger>
          <TabsTrigger value="habits" className="data-[state=active]:bg-[#B6CAEB]/20 data-[state=active]:text-[#B6CAEB]">Habits</TabsTrigger>
        </TabsList>
        
        {/* GOALS TAB */}
        <TabsContent value="goals" className="space-y-4 mt-0">
          {isLoadingGoals ? (
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
                Goals help you track progress on multiple tasks. Click the + button to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-5 my-4">
              {goals.map((goal) => {
                const progressPercent = (goal.progress / goal.target) * 100;
                
                return (
                  <div key={goal.id} className="bg-[#FFF8E8] p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-base font-semibold text-gray-800">{goal.name}</h3>
                      <Badge variant={goal.status === "completed" ? "default" : "outline"} 
                        className={goal.status === "completed" ? "bg-green-500 hover:bg-green-600" : ""}>
                        {goal.status === "not_started" ? "Not Started" : 
                          goal.status === "completed" ? "Completed" : 
                          goal.status === "cancelled" ? "Cancelled" : "In Progress"}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {goal.targetDate && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" /> 
                          Due: {formatDate(goal.targetDate)}
                        </span>
                      )}
                    </p>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500">Progress</span>
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
                    
                    {/* Display related tasks count here if API supports it */}
                    <div className="mt-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <ClipboardList className="h-3 w-3 mr-1" />
                        {tasks.filter(task => task.goalId === goal.id).length} tasks 
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-center text-[#9AAB63] hover:text-[#9AAB63]/80"
            asChild
          >
            <Link to="/goals#top" onClick={() => window.scrollTo(0, 0)}>
              View All Goals <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </TabsContent>
        
        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4 mt-0">
          {isLoadingTasks ? (
            <div className="space-y-4 my-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center p-6 my-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#F5B8DB]/10 flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-[#F5B8DB]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Tasks Yet</h3>
              <p className="text-gray-600 mb-6">
                Tasks are single items you need to complete. Click the + button to create one.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Active Tasks ({activeTasks.length})</h3>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                  <Filter className="h-3.5 w-3.5" /> Filter
                </Button>
              </div>
              
              <div className="space-y-2 mb-6">
                {activeTasks.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No active tasks! 🎉</p>
                  </div>
                ) : (
                  activeTasks.map((task) => (
                    <div key={task.id} className="bg-[#FFF8E8] p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full border border-[#F5B8DB]/30"
                        onClick={() => toggleTaskCompletionMutation.mutate({ taskId: task.id, completed: true })}
                      >
                        <CheckCircle className="h-5 w-5 text-gray-300" />
                      </Button>
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800">{task.title}</h4>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                      
                      {task.priority !== "medium" && (
                        <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-xs ml-auto">
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {completedTasks.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Completed ({completedTasks.length})</h3>
                  </div>
                  
                  <div className="space-y-2 opacity-60">
                    {completedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => toggleTaskCompletionMutation.mutate({ taskId: task.id, completed: false })}
                        >
                          <CheckCircle2 className="h-5 w-5 text-[#F5B8DB]" />
                        </Button>
                        
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-700 line-through">{task.title}</h4>
                          {task.completedAt && (
                            <p className="text-xs text-gray-500 flex items-center mt-0.5">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed: {formatDate(task.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-center text-[#F5B8DB] hover:text-[#F5B8DB]/80"
                asChild
              >
                <Link to="/tasks#top" onClick={() => window.scrollTo(0, 0)}>
                  Manage All Tasks <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </>
          )}
        </TabsContent>
        
        {/* HABITS TAB */}
        <TabsContent value="habits" className="space-y-4 mt-0">
          {isLoadingHabits ? (
            <div className="space-y-4 my-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center p-6 my-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#B6CAEB]/10 flex items-center justify-center mb-4">
                <Flame className="h-8 w-8 text-[#B6CAEB]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Habits Yet</h3>
              <p className="text-gray-600 mb-6">
                Habits help you build consistent routines. Click the + button to create one.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Today's Habits</h3>
                <span className="text-xs text-gray-500">{currentMonth}</span>
              </div>
              
              <div className="space-y-4">
                {habits.map((habit) => (
                  <div key={habit.id} className="bg-[#FFF8E8] p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">{habit.title}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {habit.frequency}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center text-xs text-gray-600">
                        <Flame className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        Streak: {habit.streak} days
                      </span>
                      
                      <Button
                        variant={habit.completedToday ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-7 px-2 rounded-full text-xs",
                          habit.completedToday 
                            ? "bg-[#B6CAEB] hover:bg-[#B6CAEB]/80" 
                            : "text-[#B6CAEB] border-[#B6CAEB]/30"
                        )}
                        onClick={() => toggleHabitCompletionMutation.mutate({ habitId: habit.id, completed: !habit.completedToday })}
                      >
                        {habit.completedToday ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done today
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark complete
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Streak Calendar Visualization */}
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1.5">Streak Calendar</div>
                      <div className="flex flex-wrap gap-1">
                        {/* This would be dynamically generated from completionHistory */}
                        {Array.from({ length: 14 }).map((_, i) => {
                          // Determine if the day is completed - in real implementation this would use habit.completionHistory
                          const isCompleted = habit.completedToday && i === 0 ? true : Math.random() > 0.5;
                          
                          return (
                            <div 
                              key={i} 
                              className={cn(
                                "w-5 h-5 rounded-sm flex items-center justify-center text-xs",
                                isCompleted ? 'bg-[#B6CAEB]/20 text-[#B6CAEB]' : 'bg-gray-50 text-gray-300'
                              )}
                              title={isCompleted ? "Completed" : "Not completed"}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-center text-[#B6CAEB] hover:text-[#B6CAEB]/80"
                asChild
              >
                <Link to="/habits#top" onClick={() => window.scrollTo(0, 0)}>
                  Manage All Habits <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
