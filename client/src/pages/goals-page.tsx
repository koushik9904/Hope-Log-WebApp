import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Goal as GoalBase } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended Goal type with the new fields
interface Goal extends GoalBase {
  description: string | null;
  category: string;
  targetDate: string | null;
}

// Extended types for items in the recycle bin
interface DeletedGoal extends Goal {
  deletedAt: string;
}

interface DeletedHabit {
  id: number;
  title: string;
  description: string;
  frequency: string;
  streak: number;
  userId: number;
  completedToday: boolean;
  deletedAt: string;
}
import { 
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Edit,
  Lightbulb,
  Plus,
  PencilLine,
  PlusCircle,
  Sparkles,
  Star,
  Target,
  Trash,
  Trash2,
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
import { Label } from "@/components/ui/label";
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
  targetDate: z.string()
    .refine(
      (date) => {
        if (!date) return true; // Optional, so empty is fine
        // Check if the date is in the future or today
        return new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      {
        message: "Target date must be today or in the future."
      }
    )
    .optional(),
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

// Example AI-suggested goals - derived both from generic goals and journal analysis
const AI_SUGGESTED_GOALS = [
  {
    id: "ai-1",
    name: "Meditate for 10 minutes daily",
    description: "Practice mindfulness meditation to reduce stress",
    category: "Health",
    targetDate: null,
    source: "Journal analysis identified stress as a recurring theme" // From journal analysis
  },
  {
    id: "ai-2",
    name: "Learn a new programming language",
    description: "Expand your technical skills by learning a new language",
    category: "Learning",
    targetDate: null,
    source: "Based on your career interests" // Generic suggestion
  },
  {
    id: "ai-3",
    name: "Read 20 books this year",
    description: "Cultivate knowledge through regular reading",
    category: "Personal",
    targetDate: null,
    source: "Journal mentioned interest in reading more frequently" // From journal analysis
  }
];

// Example AI-suggested habits - derived from both generic habits and journal analysis
const AI_SUGGESTED_HABITS = [
  {
    id: "ai-habit-1",
    title: "Drink 8 glasses of water",
    description: "Stay hydrated throughout the day",
    frequency: "daily",
    source: "General wellness recommendation" // Generic suggestion
  },
  {
    id: "ai-habit-2",
    title: "15-minute morning walk",
    description: "Start your day with fresh air and light exercise",
    frequency: "daily",
    source: "Journal entries show improved mood after outdoor activities" // From journal analysis
  },
  {
    id: "ai-habit-3",
    title: "Phone-free hour before sleep",
    description: "Improve sleep quality by reducing blue light exposure",
    frequency: "daily",
    source: "Journal mentioned trouble sleeping" // From journal analysis
  }
];

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [showNewHabitDialog, setShowNewHabitDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("goals");
  const [aiSuggestedGoals, setAiSuggestedGoals] = useState(AI_SUGGESTED_GOALS);
  
  // Fetch goals data
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Filter AI-suggested goals to remove any that already exist in the user's goals list
  const [filteredAiSuggestedGoals, setFilteredAiSuggestedGoals] = useState<typeof AI_SUGGESTED_GOALS>([]);
  
  useEffect(() => {
    if (goals.length > 0) {
      // Filter out AI goals that already exist in the user's goals
      const filtered = AI_SUGGESTED_GOALS.filter(aiGoal => 
        !goals.some(userGoal => 
          // Case-insensitive name comparison
          userGoal.name.toLowerCase() === aiGoal.name.toLowerCase()
        )
      );
      setFilteredAiSuggestedGoals(filtered);
    } else {
      setFilteredAiSuggestedGoals(AI_SUGGESTED_GOALS);
    }
  }, [goals]);
  
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
  
  // Edit goal mutation
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [showEditGoalDialog, setShowEditGoalDialog] = useState(false);
  
  const editGoalMutation = useMutation({
    mutationFn: async (goal: GoalFormValues & { id: number }) => {
      const { id, ...data } = goal;
      const res = await apiRequest("PUT", `/api/goals/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      setShowEditGoalDialog(false);
    },
  });
  
  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      // Find the goal before deleting it
      const goalToDelete = goals.find(g => g.id === id);
      if (goalToDelete) {
        // Add to deleted goals with timestamp
        setDeletedGoals(prev => [...prev, {
          ...goalToDelete,
          deletedAt: new Date().toISOString()
        }]);
      }
      
      // Proceed with deletion from database
      const res = await apiRequest("DELETE", `/api/goals/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      toast({
        title: "Goal moved to recycle bin",
        description: "You can restore this goal within 7 days",
      });
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
    
    // Create a new habit with definite userId
    const newHabit = {
      id: Date.now(), // Temporary ID until API implementation
      title: values.title,
      description: values.description || "",
      frequency: values.frequency,
      streak: 0,
      userId: user?.id ?? 1, // Fallback to 1 if user?.id is undefined
      completedToday: false
    };
    
    // Add to habits list
    setHabits(prev => [...prev, newHabit].sort((a, b) => {
      // Sort to put uncompleted habits on top
      if (a.completedToday && !b.completedToday) return 1;
      if (!a.completedToday && b.completedToday) return -1;
      return 0;
    }));
    
    setShowNewHabitDialog(false);
    
    // Reset form for next use
    habitForm.reset({
      title: "",
      description: "",
      frequency: "daily",
      userId: user?.id
    });
  };
  
  // Handler for adopting AI-suggested goals
  const adoptAiGoal = (aiGoal: typeof AI_SUGGESTED_GOALS[0]) => {
    if (!user?.id) return;
    
    addGoalMutation.mutate({
      name: aiGoal.name,
      description: aiGoal.description || "",
      targetDate: aiGoal.targetDate || "",
      category: aiGoal.category,
      target: 100,
      progress: 0,
      unit: "%",
      colorScheme: 1,
      userId: user.id
    });
    
    // Remove the goal from suggestions after adopting
    setAiSuggestedGoals(prev => prev.filter(g => g.id !== aiGoal.id));
    setFilteredAiSuggestedGoals(prev => prev.filter(g => g.id !== aiGoal.id));
  };
  
  // Group goals by category
  const goalsByCategory = goals.reduce<Record<string, Goal[]>>((acc, goal) => {
    const category = goal.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(goal);
    return acc;
  }, {});
  
  // Reset form when goalToEdit changes
  useEffect(() => {
    if (goalToEdit) {
      goalForm.reset({
        name: goalToEdit.name,
        description: goalToEdit.description || "",
        targetDate: goalToEdit.targetDate || "",
        category: goalToEdit.category,
        target: goalToEdit.target,
        progress: goalToEdit.progress,
        unit: goalToEdit.unit,
        colorScheme: goalToEdit.colorScheme,
        userId: user?.id
      });
    }
  }, [goalToEdit, goalForm, user?.id]);

  // Calculate completion rates
  const completedGoals = goals.filter(goal => goal.progress === 100).length;
  const completionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
  
  // Habits (using example data for now)
  const [habits, setHabits] = useState(EXAMPLE_HABITS);
  const [aiSuggestedHabits, setAiSuggestedHabits] = useState(AI_SUGGESTED_HABITS);
  const [filteredAiSuggestedHabits, setFilteredAiSuggestedHabits] = useState<typeof AI_SUGGESTED_HABITS>([]);
  const [habitToEdit, setHabitToEdit] = useState<typeof EXAMPLE_HABITS[0] | null>(null);
  const [showEditHabitDialog, setShowEditHabitDialog] = useState(false);
  
  // Recycle bin for deleted items
  const [deletedGoals, setDeletedGoals] = useState<DeletedGoal[]>([]);
  const [deletedHabits, setDeletedHabits] = useState<DeletedHabit[]>([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  
  // User's premium status - for determining retention period
  // In a real app, this would be part of the user object from the database
  const isPremiumUser = user?.id === 1; // For demo purposes, assume user 1 is premium
  
  // Filter AI-suggested habits to remove any that already exist in the user's habits list
  useEffect(() => {
    // Filter out AI habits that already exist in the user's habits
    const filtered = AI_SUGGESTED_HABITS.filter(aiHabit => 
      !habits.some(userHabit => 
        // Case-insensitive title comparison
        userHabit.title.toLowerCase() === aiHabit.title.toLowerCase()
      )
    );
    setFilteredAiSuggestedHabits(filtered);
  }, [habits]);
  
  // Function to toggle habit completion
  const toggleHabitCompletion = (habitId: number) => {
    setHabits(prev => 
      prev.map(habit => 
        habit.id === habitId 
          ? { ...habit, completedToday: !habit.completedToday }
          : habit
      ).sort((a, b) => {
        // Sort to put uncompleted habits on top
        if (a.completedToday && !b.completedToday) return 1;
        if (!a.completedToday && b.completedToday) return -1;
        return 0;
      })
    );
  };
  
  // Delete habit handler - move to recycle bin
  const deleteHabit = (habitId: number) => {
    const habitToDelete = habits.find(h => h.id === habitId);
    if (habitToDelete) {
      // Add the habit to the recycle bin with deletion timestamp
      setDeletedHabits(prev => [...prev, {
        ...habitToDelete,
        deletedAt: new Date().toISOString()
      }]);
      
      // Remove from active habits list
      setHabits(prev => prev.filter(habit => habit.id !== habitId));
    }
  };
  
  // Edit habit handler
  const updateHabit = (updatedHabit: typeof EXAMPLE_HABITS[0]) => {
    setHabits(prev => 
      prev.map(habit => 
        habit.id === updatedHabit.id ? updatedHabit : habit
      ).sort((a, b) => {
        // Sort to put uncompleted habits on top
        if (a.completedToday && !b.completedToday) return 1;
        if (!a.completedToday && b.completedToday) return -1;
        return 0;
      })
    );
    setShowEditHabitDialog(false);
  };
  
  // Handler for adopting AI-suggested habits
  const adoptAiHabit = (aiHabit: typeof AI_SUGGESTED_HABITS[0]) => {
    if (!user?.id) return;
    
    // Create a new habit from the AI suggestion
    const newHabit = {
      id: Date.now(), // Temporary ID until API implementation
      title: aiHabit.title,
      description: aiHabit.description || "",
      frequency: aiHabit.frequency,
      streak: 0,
      userId: user.id,
      completedToday: false
    };
    
    // Add to habits list
    setHabits(prev => [...prev, newHabit].sort((a, b) => {
      // Sort to put uncompleted habits on top
      if (a.completedToday && !b.completedToday) return 1;
      if (!a.completedToday && b.completedToday) return -1;
      return 0;
    }));
    
    // Remove from suggestions
    setAiSuggestedHabits(prev => prev.filter(h => h.id !== aiHabit.id));
    setFilteredAiSuggestedHabits(prev => prev.filter(h => h.id !== aiHabit.id));
  };
  
  // Restore goal from recycle bin
  const restoreGoal = (goalId: number) => {
    // Find the goal in deleted goals
    const goalToRestore = deletedGoals.find(g => g.id === goalId);
    if (!goalToRestore) return;
    
    // Add goal back to database
    const { deletedAt, ...goalData } = goalToRestore;
    
    // Use the add goal mutation to restore the goal
    addGoalMutation.mutate({
      name: goalData.name,
      description: goalData.description || "",
      targetDate: goalData.targetDate || "",
      category: goalData.category,
      target: goalData.target,
      progress: goalData.progress,
      unit: goalData.unit || "%",
      colorScheme: goalData.colorScheme || 1,
      userId: goalData.userId
    });
    
    // Remove from deleted goals
    setDeletedGoals(prev => prev.filter(g => g.id !== goalId));
    
    toast({
      title: "Goal restored",
      description: `${goalData.name} has been restored to your goals`,
    });
  };
  
  // Permanently delete goal from recycle bin
  const permanentlyDeleteGoal = (goalId: number) => {
    // Remove from deleted goals list
    setDeletedGoals(prev => prev.filter(g => g.id !== goalId));
    
    toast({
      title: "Goal deleted permanently",
      description: "This goal has been permanently removed",
      variant: "destructive"
    });
  };
  
  // Restore habit from recycle bin
  const restoreHabit = (habitId: number) => {
    // Find the habit in deleted habits
    const habitToRestore = deletedHabits.find(h => h.id === habitId);
    if (!habitToRestore) return;
    
    // Remove the deletedAt property
    const { deletedAt, ...habitData } = habitToRestore;
    
    // Add habit back to habits list
    setHabits(prev => [...prev, habitData].sort((a, b) => {
      if (a.completedToday && !b.completedToday) return 1;
      if (!a.completedToday && b.completedToday) return -1;
      return 0;
    }));
    
    // Remove from deleted habits
    setDeletedHabits(prev => prev.filter(h => h.id !== habitId));
    
    toast({
      title: "Habit restored",
      description: `${habitData.title} has been restored to your habits`,
    });
  };
  
  // Permanently delete habit from recycle bin
  const permanentlyDeleteHabit = (habitId: number) => {
    // Remove from deleted habits list
    setDeletedHabits(prev => prev.filter(h => h.id !== habitId));
    
    toast({
      title: "Habit deleted permanently",
      description: "This habit has been permanently removed",
      variant: "destructive"
    });
  };
  
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
            <Button 
              variant="outline" 
              onClick={() => setShowRecycleBin(!showRecycleBin)}
              className={`${showRecycleBin ? 'bg-[#f5d867] text-gray-700' : 'bg-white'} gap-2`}
            >
              <Trash2 className="h-4 w-4" /> Recycle Bin
              {(deletedGoals.length > 0 || deletedHabits.length > 0) && (
                <Badge className="ml-1 bg-[#f096c9] text-white">
                  {deletedGoals.length + deletedHabits.length}
                </Badge>
              )}
            </Button>
            
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
        
        {/* Recycle Bin */}
        {showRecycleBin && (
          <Card className="bg-white border-0 shadow-sm mb-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-gray-700" />
                Recycle Bin
              </CardTitle>
              <CardDescription>
                Items deleted within the last {isPremiumUser ? '30' : '7'} days can be restored
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 divide-y">
              {deletedGoals.length === 0 && deletedHabits.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p>Recycle bin is empty</p>
                </div>
              )}
              
              {/* Deleted Goals */}
              {deletedGoals.length > 0 && (
                <div className="pb-4">
                  <h3 className="font-semibold mb-3 text-gray-700">Deleted Goals</h3>
                  <div className="space-y-3">
                    {deletedGoals.map(goal => {
                      // Calculate days remaining before permanent deletion
                      const deletedAt = new Date(goal.deletedAt);
                      const expiresIn = isPremiumUser ? 30 : 7; // days
                      const expirationDate = new Date(deletedAt.getTime() + expiresIn * 24 * 60 * 60 * 1000);
                      const daysRemaining = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                      
                      return (
                        <div key={goal.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-sm text-gray-500">
                              <span className="mr-2">{goal.category}</span>
                              <span>{daysRemaining} days until permanent deletion</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-[#B6CAEB] text-white border-0 hover:bg-[#95b9e5]"
                              onClick={() => restoreGoal(goal.id)}
                            >
                              Restore
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-100 text-red-500 border-0 hover:bg-red-200"
                              onClick={() => permanentlyDeleteGoal(goal.id)}
                            >
                              Delete Forever
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Deleted Habits */}
              {deletedHabits.length > 0 && (
                <div className="pt-4">
                  <h3 className="font-semibold mb-3 text-gray-700">Deleted Habits</h3>
                  <div className="space-y-3">
                    {deletedHabits.map(habit => {
                      // Calculate days remaining before permanent deletion
                      const deletedAt = new Date(habit.deletedAt);
                      const expiresIn = isPremiumUser ? 30 : 7; // days
                      const expirationDate = new Date(deletedAt.getTime() + expiresIn * 24 * 60 * 60 * 1000);
                      const daysRemaining = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                      
                      return (
                        <div key={habit.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-medium">{habit.title}</div>
                            <div className="text-sm text-gray-500">
                              <span className="mr-2">{habit.frequency}</span>
                              <span>{daysRemaining} days until permanent deletion</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-[#B6CAEB] text-white border-0 hover:bg-[#95b9e5]"
                              onClick={() => restoreHabit(habit.id)}
                            >
                              Restore
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-100 text-red-500 border-0 hover:bg-red-200"
                              onClick={() => permanentlyDeleteHabit(habit.id)}
                            >
                              Delete Forever
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-[#333] text-white">
            <TabsTrigger value="goals" className="data-[state=active]:bg-[#F5B8DB] data-[state=active]:text-white data-[state=inactive]:text-white">Goals</TabsTrigger>
            <TabsTrigger value="habits" className="data-[state=active]:bg-[#F5B8DB] data-[state=active]:text-white data-[state=inactive]:text-white">Habits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="goals">
            {/* AI-suggested goals section */}
            {filteredAiSuggestedGoals.length > 0 && (
              <Card className="bg-white border-0 shadow-sm mb-8">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-[#F5B8DB]" />
                    AI Suggested Goals
                  </CardTitle>
                  <CardDescription>
                    Personalized goal recommendations based on your journal entries
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredAiSuggestedGoals.map(goal => (
                      <div key={goal.id} className="bg-[#fbf1f7] p-4 rounded-xl border border-[#F5B8DB] border-opacity-30">
                        <h4 className="font-medium text-gray-800 mb-2">{goal.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className="bg-[#F5B8DB] text-white">{goal.category}</Badge>
                          <div className="flex-1"></div>
                          <Button 
                            onClick={() => adoptAiGoal(goal)}
                            className="bg-[#9AAB63] hover:bg-[#8a9a58] text-white text-xs px-3"
                            size="sm"
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" /> Add to Goals
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setAiSuggestedGoals(prev => prev.filter(g => g.id !== goal.id));
                              setFilteredAiSuggestedGoals(prev => prev.filter(g => g.id !== goal.id));
                            }}
                            className="text-gray-500 text-xs px-2 border-gray-300 bg-white"
                            size="sm"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Edit Goal Dialog */}
              <Dialog open={showEditGoalDialog} onOpenChange={setShowEditGoalDialog}>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-['Montserrat_Variable']">Edit Goal</DialogTitle>
                    <DialogDescription>
                      Update your goal details.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {goalToEdit && (
                    <Form {...goalForm}>
                      <form 
                        onSubmit={goalForm.handleSubmit((values) => {
                          editGoalMutation.mutate({
                            ...values,
                            id: goalToEdit.id
                          });
                        })} 
                        className="space-y-6 py-4"
                      >
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
                            onClick={() => setShowEditGoalDialog(false)}
                            className="bg-white"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white"
                            disabled={editGoalMutation.isPending}
                          >
                            {editGoalMutation.isPending ? "Updating..." : "Update Goal"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  )}
                </DialogContent>
              </Dialog>

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
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setGoalToEdit(goal);
                                          setShowEditGoalDialog(true);
                                        }}
                                      >
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
            {/* Edit Habit Dialog */}
            <Dialog open={showEditHabitDialog} onOpenChange={setShowEditHabitDialog}>
              <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                  <DialogTitle className="font-['Montserrat_Variable']">Edit Habit</DialogTitle>
                  <DialogDescription>
                    Update this habit's details.
                  </DialogDescription>
                </DialogHeader>
                
                {habitToEdit && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const title = formData.get('title') as string;
                      const description = formData.get('description') as string;
                      const frequency = formData.get('frequency') as string;
                      
                      if (!title || !frequency) return;
                      
                      updateHabit({
                        ...habitToEdit,
                        title,
                        description,
                        frequency: frequency as "daily" | "weekly" | "monthly"
                      });
                    }} 
                    className="space-y-6 py-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Habit Name</Label>
                        <Input 
                          id="title" 
                          name="title" 
                          defaultValue={habitToEdit.title} 
                          placeholder="Enter habit name"
                          className="bg-white"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input 
                          id="description" 
                          name="description" 
                          defaultValue={habitToEdit.description || ""} 
                          placeholder="Describe this habit"
                          className="bg-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select name="frequency" defaultValue={habitToEdit.frequency}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowEditHabitDialog(false)}
                        className="bg-white"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white">
                        Update Habit
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* AI-suggested habits section */}
              {filteredAiSuggestedHabits.length > 0 && (
                <Card className="md:col-span-4 bg-white border-0 shadow-sm mb-6">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#F5D867]" />
                      AI Suggested Habits
                    </CardTitle>
                    <CardDescription>
                      Personalized habit recommendations based on your journal entries and health patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {filteredAiSuggestedHabits.map(habit => (
                        <div key={habit.id} className="bg-[#f4f7ec] p-4 rounded-xl border border-[#9AAB63] border-opacity-30">
                          <h4 className="font-medium text-gray-800 mb-2">{habit.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-[#9AAB63] text-white">{habit.frequency}</Badge>
                          </div>
                          <div className="text-xs text-gray-500 italic mb-3">
                            <Lightbulb className="h-3 w-3 inline mr-1" />
                            {habit.source}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => adoptAiHabit(habit)}
                              className="bg-[#9AAB63] hover:bg-[#8a9a58] text-white text-xs px-3 flex-1"
                              size="sm"
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" /> Add to Habits
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setAiSuggestedHabits(prev => prev.filter(h => h.id !== habit.id));
                                setFilteredAiSuggestedHabits(prev => prev.filter(h => h.id !== habit.id));
                              }}
                              className="text-gray-500 text-xs px-2 border-gray-300 bg-white"
                              size="sm"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
                              <button 
                                onClick={() => toggleHabitCompletion(habit.id)}
                                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 cursor-pointer hover:shadow-md ${
                                  habit.completedToday 
                                    ? 'bg-[#9AAB63] border-[#9AAB63] text-white animate-checkmark' 
                                    : 'border-gray-300 bg-white hover:border-[#9AAB63]'
                                }`}
                              >
                                {habit.completedToday && <Check className="h-3 w-3" />}
                              </button>
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setHabitToEdit(habit);
                                    setShowEditHabitDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteHabit(habit.id)}
                                  className="text-red-600"
                                >
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