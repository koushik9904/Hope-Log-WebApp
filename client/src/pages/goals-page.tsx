import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Goal } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Edit,
  Plus,
  Star,
  Target,
  Trash,
  TrendingUp,
  CheckCircle,
  Calendar,
  X,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema for creating/editing goals
const goalSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters."
  }).max(50, {
    message: "Title must not be longer than 50 characters."
  }),
  description: z.string().max(200, {
    message: "Description must not be longer than 200 characters."
  }).optional(),
  targetDate: z.string().optional(),
  category: z.string(),
  userId: z.number()
});

// Form schema for habits
const habitSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters."
  }).max(50, {
    message: "Title must not be longer than 50 characters."
  }),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  description: z.string().max(200, {
    message: "Description must not be longer than 200 characters."
  }).optional(),
  userId: z.number()
});

type GoalFormValues = z.infer<typeof goalSchema>;
type HabitFormValues = z.infer<typeof habitSchema>;

// Example categories
const GOAL_CATEGORIES = [
  "Personal",
  "Health",
  "Career",
  "Financial",
  "Learning",
  "Relationships",
  "Other"
];

// Example habits (in a real app, these would be fetched from the database)
const EXAMPLE_HABITS = [
  {
    id: 1,
    title: "Drink water",
    description: "Drink at least 8 glasses of water daily",
    frequency: "daily",
    streak: 5,
    userId: 1,
    completedToday: true
  },
  {
    id: 2,
    title: "Read a book",
    description: "Read for at least 30 minutes",
    frequency: "daily",
    streak: 3,
    userId: 1,
    completedToday: false
  },
  {
    id: 3,
    title: "Weekly review",
    description: "Review goals and plan for the week ahead",
    frequency: "weekly",
    streak: 2,
    userId: 1,
    completedToday: false
  }
];

export default function GoalsPage() {
  const { user } = useAuth();
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [showNewHabitDialog, setShowNewHabitDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("goals");
  
  // Fetch goals data
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goal: GoalFormValues) => {
      const res = await apiRequest("POST", "/api/goals", goal);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      setShowNewGoalDialog(false);
    },
  });
  
  // Update goal progress mutation
  const updateGoalProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: number; progress: number }) => {
      const res = await apiRequest("PATCH", `/api/goals/${id}/progress`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
    },
  });
  
  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/goals/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
    },
  });
  
  // Form setup for goals
  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetDate: "",
      category: "Personal",
      userId: user?.id
    },
  });
  
  // Form setup for habits
  const habitForm = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: "",
      description: "",
      frequency: "daily",
      userId: user?.id
    },
  });
  
  // Submit handlers
  const onGoalSubmit = (values: GoalFormValues) => {
    addGoalMutation.mutate(values);
  };
  
  const onHabitSubmit = (values: HabitFormValues) => {
    console.log("New habit:", values);
    setShowNewHabitDialog(false);
  };
  
  // Group goals by category
  const goalsByCategory = goals.reduce<Record<string, Goal[]>>((acc, goal) => {
    const category = goal.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(goal);
    return acc;
  }, {});
  
  // Calculate completion rates
  const completedGoals = goals.filter(goal => goal.progress === 100).length;
  const completionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
  
  // Habits (using example data for now)
  const habits = EXAMPLE_HABITS;
  const completedHabitsToday = habits.filter(habit => habit.completedToday).length;
  const habitCompletionRate = habits.length > 0 ? Math.round((completedHabitsToday / habits.length) * 100) : 0;
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Goals & Habits</h1>
          <p className="text-gray-500">
            Track your progress and build positive habits
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === "goals" ? (
            <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
              <DialogTrigger asChild>
                <Button className="pi-button flex items-center gap-2">
                  <Plus className="h-4 w-4" /> New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Goal</DialogTitle>
                  <DialogDescription>
                    Create a new goal to track your progress and achievements.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...goalForm}>
                  <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-6 py-4">
                    <FormField
                      control={goalForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter goal title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={goalForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of your goal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={goalForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GOAL_CATEGORIES.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
                        name="targetDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Date (optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={goalForm.control}
                      name="userId"
                      render={({ field }) => (
                        <input type="hidden" value={user?.id} />
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowNewGoalDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="pi-button"
                        disabled={addGoalMutation.isPending}
                      >
                        {addGoalMutation.isPending ? "Adding..." : "Add Goal"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={showNewHabitDialog} onOpenChange={setShowNewHabitDialog}>
              <DialogTrigger asChild>
                <Button className="pi-button flex items-center gap-2">
                  <Plus className="h-4 w-4" /> New Habit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Habit</DialogTitle>
                  <DialogDescription>
                    Build positive habits by tracking them consistently.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...habitForm}>
                  <form onSubmit={habitForm.handleSubmit(onHabitSubmit)} className="space-y-6 py-4">
                    <FormField
                      control={habitForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Habit Name</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Drink water, Read daily" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={habitForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Details about this habit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={habitForm.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How often?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={habitForm.control}
                      name="userId"
                      render={({ field }) => (
                        <input type="hidden" value={user?.id} />
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowNewHabitDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="pi-button">
                        Create Habit
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="goals">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goals.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedGoals} completed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <Progress value={completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Goal Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(goalsByCategory).map((category) => (
                    <Badge key={category} variant="secondary">
                      {category} ({goalsByCategory[category].length})
                    </Badge>
                  ))}
                  {Object.keys(goalsByCategory).length === 0 && (
                    <span className="text-gray-500 text-sm">No categories yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="pi-thinking-dots">
                <div className="pi-thinking-dot"></div>
                <div className="pi-thinking-dot"></div>
                <div className="pi-thinking-dot"></div>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No goals yet</h3>
              <p className="text-gray-500 mb-4">
                Start by creating your first goal to track
              </p>
              <Button 
                className="pi-button"
                onClick={() => setShowNewGoalDialog(true)}
              >
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(goalsByCategory).map(([category, categoryGoals]) => (
                <div key={category}>
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                    {category}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryGoals.map((goal) => (
                      <Card key={goal.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Edit goal logic would go here
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this goal?")) {
                                      deleteGoalMutation.mutate(goal.id);
                                    }
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardDescription>
                            {goal.description || "No description provided"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1.5 text-sm">
                                <span className="text-gray-500">Progress</span>
                                <span 
                                  className={goal.progress === 100 ? "text-green-600 font-medium" : ""}
                                >
                                  {goal.progress}%
                                </span>
                              </div>
                              <Progress 
                                value={goal.progress} 
                                className="h-2" 
                              />
                            </div>
                            
                            {goal.targetDate && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>
                                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t bg-gray-50 flex justify-between">
                          {goal.progress === 100 ? (
                            <div className="flex items-center text-green-600 text-sm font-medium">
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Completed
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const newProgress = Math.min(100, goal.progress + 10);
                                  updateGoalProgressMutation.mutate({
                                    id: goal.id,
                                    progress: newProgress
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Update
                              </Button>
                              <Button 
                                size="sm"
                                className="pi-button"
                                onClick={() => {
                                  updateGoalProgressMutation.mutate({
                                    id: goal.id,
                                    progress: 100
                                  });
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="habits">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{habits.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedHabitsToday} completed today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="text-2xl font-bold">{habitCompletionRate}%</div>
                  <Progress value={habitCompletionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...habits.map(h => h.streak))} days
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Keep it going!
                </p>
              </CardContent>
            </Card>
          </div>
          
          {habits.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No habits yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first habit to start building consistency
              </p>
              <Button 
                className="pi-button"
                onClick={() => setShowNewHabitDialog(true)}
              >
                Create Your First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                  Today's Habits
                </h2>
                
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {habits.filter(h => h.frequency === "daily").map((habit) => (
                      <div 
                        key={habit.id} 
                        className={`p-4 flex items-center justify-between ${
                          habit.completedToday ? "bg-green-50" : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center mr-4
                            ${habit.completedToday 
                              ? "bg-green-100 text-green-600" 
                              : "bg-gray-100 text-gray-500"
                            }
                          `}>
                            {habit.completedToday ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{habit.title}</h3>
                            <p className="text-sm text-gray-500 max-w-md">
                              {habit.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                            <Star className="h-4 w-4 text-blue-500 mr-1.5" />
                            <span className="text-sm font-medium">
                              {habit.streak} day streak
                            </span>
                          </div>
                          
                          {habit.completedToday ? (
                            <Button variant="ghost" size="sm" className="text-gray-500">
                              <X className="h-4 w-4 mr-1.5" />
                              Undo
                            </Button>
                          ) : (
                            <Button className="pi-button" size="sm">
                              <Check className="h-4 w-4 mr-1.5" />
                              Complete
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
                  Weekly Habits
                </h2>
                
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {habits.filter(h => h.frequency === "weekly").map((habit) => (
                      <div 
                        key={habit.id} 
                        className={`p-4 flex items-center justify-between ${
                          habit.completedToday ? "bg-green-50" : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center mr-4
                            ${habit.completedToday 
                              ? "bg-green-100 text-green-600" 
                              : "bg-purple-100 text-purple-600"
                            }
                          `}>
                            {habit.completedToday ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Calendar className="h-5 w-5" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{habit.title}</h3>
                            <p className="text-sm text-gray-500 max-w-md">
                              {habit.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Weekly</Badge>
                          
                          {habit.completedToday ? (
                            <Button variant="ghost" size="sm" className="text-gray-500">
                              <X className="h-4 w-4 mr-1.5" />
                              Undo
                            </Button>
                          ) : (
                            <Button className="pi-button" size="sm">
                              <Check className="h-4 w-4 mr-1.5" />
                              Complete
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}