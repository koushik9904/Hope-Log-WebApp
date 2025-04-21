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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  name: z.string().min(2, {
    message: "Title must be at least 2 characters."
  }).max(50, {
    message: "Title must not be longer than 50 characters."
  }),
  description: z.string().max(200, {
    message: "Description must not be longer than 200 characters."
  }).optional(),
  targetDate: z.string().optional(),
  category: z.string(),
  target: z.number().default(100),
  progress: z.number().default(0),
  unit: z.string().default("%"),
  colorScheme: z.number().default(1),
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
      const res = await apiRequest("PATCH", `/api/goals/${id}`, { progress });
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
      name: "",
      description: "",
      targetDate: "",
      category: "Personal",
      target: 100,
      progress: 0,
      unit: "%",
      colorScheme: 1,
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
  
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Goals & Habits</h1>
            <p className="text-gray-500 font-['Inter_Variable']">
              Track your progress and build positive habits
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === "goals" ? (
              <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-['Montserrat_Variable']">Add New Goal</DialogTitle>
                    <DialogDescription>
                      Create a new goal to track your progress and achievements.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...goalForm}>
                    <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-6 py-4">
                      <FormField
                        control={goalForm.control}
                        name="name"
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
                                  <SelectTrigger className="bg-white">
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
                                <Input type="date" {...field} className="bg-white" />
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
                          className="bg-white"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white"
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
                  <Button className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Habit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-['Montserrat_Variable']">Create New Habit</DialogTitle>
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
                              <Input placeholder="E.g., Drink water, Read daily" {...field} className="bg-white" />
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
                              <Input placeholder="Details about this habit" {...field} className="bg-white" />
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
                                <SelectTrigger className="bg-white">
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
                          className="bg-white"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white">
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
          <TabsList className="mb-6 bg-black">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="goals">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="md:col-span-3 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Your Goals</CardTitle>
                  <CardDescription>
                    Track and achieve your personal objectives
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
                    </div>
                  ) : goals.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(goalsByCategory).map(([category, categoryGoals]) => (
                        <div key={category} className="space-y-4">
                          <h3 className="text-lg font-medium flex items-center gap-2 font-['Montserrat_Variable']">
                            <span className="inline-block w-3 h-3 rounded-full bg-[#9AAB63]"></span>
                            {category}
                          </h3>
                          
                          <div className="space-y-4">
                            {categoryGoals.map(goal => (
                              <div key={goal.id} className="bg-[#FFF8E8] p-4 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-800">{goal.name}</h4>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white">
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        <span>Edit</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                                        className="text-red-600"
                                      >
                                        <Trash className="h-4 w-4 mr-2" />
                                        <span>Delete</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                
                                {goal.description && (
                                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                                )}
                                
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span className="font-medium">{goal.progress}%</span>
                                  </div>
                                  <Progress value={goal.progress} className="h-2 bg-white" />
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center text-gray-600">
                                    {goal.targetDate ? (
                                      <>
                                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                        <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                                        <span>No deadline</span>
                                      </>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 bg-white text-[#9AAB63] border-[#9AAB63] hover:bg-[#f5f8ee] hover:text-[#9AAB63] px-2.5"
                                      onClick={() => updateGoalProgressMutation.mutate({
                                        id: goal.id, 
                                        progress: Math.min(100, goal.progress + 10)
                                      })}
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Update
                                    </Button>
                                    
                                    {goal.progress < 100 ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 bg-white text-[#9AAB63] border-[#9AAB63] hover:bg-[#f5f8ee] hover:text-[#9AAB63] px-2.5"
                                        onClick={() => updateGoalProgressMutation.mutate({
                                          id: goal.id, 
                                          progress: 100
                                        })}
                                      >
                                        <Check className="h-3.5 w-3.5 mr-1.5" /> Complete
                                      </Button>
                                    ) : (
                                      <Badge className="bg-[#9AAB63]">
                                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Completed
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#FFF8E8] rounded-xl">
                      <Target className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Set meaningful goals to track your progress and celebrate your achievements.
                      </p>
                      <Button 
                        onClick={() => setShowNewGoalDialog(true)}
                        className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] text-lg">Progress Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Goal Completion</h4>
                        <span className="text-2xl font-bold">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-2.5 bg-[#FFF8E8]" />
                      <p className="text-xs text-gray-500 mt-2">
                        {completedGoals} of {goals.length} goals completed
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">Statistics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#F5B8DB] bg-opacity-20 flex items-center justify-center">
                              <Target className="h-4 w-4 text-[#F5B8DB]" />
                            </div>
                            <span className="text-sm">Total Goals</span>
                          </div>
                          <span className="font-medium">{goals.length}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#9AAB63] bg-opacity-20 flex items-center justify-center">
                              <Check className="h-4 w-4 text-[#9AAB63]" />
                            </div>
                            <span className="text-sm">Completed</span>
                          </div>
                          <span className="font-medium">{completedGoals}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#F5D867] bg-opacity-20 flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-[#F5D867]" />
                            </div>
                            <span className="text-sm">In Progress</span>
                          </div>
                          <span className="font-medium">{goals.length - completedGoals}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="habits">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="md:col-span-3 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Your Habits</CardTitle>
                  <CardDescription>
                    Daily, weekly, and monthly habits to build consistency
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {habits.length > 0 ? (
                    <div className="space-y-4">
                      {habits.map(habit => (
                        <div key={habit.id} className="bg-[#FFF8E8] p-4 rounded-xl">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${
                                habit.completedToday 
                                  ? 'bg-[#9AAB63] border-[#9AAB63] text-white' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {habit.completedToday && <Check className="h-3 w-3" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800">{habit.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className="bg-white">
                                    {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                                  </Badge>
                                  {habit.streak > 0 && (
                                    <Badge variant="secondary" className="bg-[#FFF8E8] border border-[#F5D867] text-[#e9a617]">
                                      <Star className="h-3 w-3 mr-1 fill-[#F5D867] text-[#F5D867]" />
                                      {habit.streak} day streak
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-white">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash className="h-4 w-4 mr-2" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#FFF8E8] rounded-xl">
                      <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Create daily, weekly or monthly habits to build consistency and achieve your goals.
                      </p>
                      <Button 
                        onClick={() => setShowNewHabitDialog(true)}
                        className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Create Your First Habit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] text-lg">Habit Stats</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Today's Completion</h4>
                        <span className="text-2xl font-bold">{habitCompletionRate}%</span>
                      </div>
                      <Progress value={habitCompletionRate} className="h-2.5 bg-[#FFF8E8]" />
                      <p className="text-xs text-gray-500 mt-2">
                        {completedHabitsToday} of {habits.length} habits completed today
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">Habit Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#B6CAEB] bg-opacity-20 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-[#B6CAEB]" />
                            </div>
                            <span className="text-sm">Daily</span>
                          </div>
                          <span className="font-medium">
                            {habits.filter(h => h.frequency === "daily").length}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#F5D867] bg-opacity-20 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-[#F5D867]" />
                            </div>
                            <span className="text-sm">Weekly</span>
                          </div>
                          <span className="font-medium">
                            {habits.filter(h => h.frequency === "weekly").length}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#F5B8DB] bg-opacity-20 flex items-center justify-center">
                              <Star className="h-4 w-4 text-[#F5B8DB]" />
                            </div>
                            <span className="text-sm">Monthly</span>
                          </div>
                          <span className="font-medium">
                            {habits.filter(h => h.frequency === "monthly").length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}