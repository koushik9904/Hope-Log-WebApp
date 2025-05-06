import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Goal as GoalBase, Habit } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TaskForm from "@/components/goals/task-form";
import TaskList from "@/components/goals/task-list";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, subDays } from "date-fns";
// This will be used to store initial data for task form

// Extended Goal type with the new fields
interface Goal extends GoalBase {
  description: string | null;
  category: string;
  targetDate: string | null;
}

// AI suggestion interfaces
interface AISuggestedGoal {
  id: number;
  name: string;           // Using 'name' to match existing goal structure
  title?: string;         // Optional for compatibility
  description: string | null;
  category?: string;
  targetDate?: string | null;
  journalEntryId?: number; // Reference to the source journal entry
  explanation?: string;    // AI's explanation for the suggestion
  userId: number;
  createdAt: string;
}

interface AISuggestedTask {
  id: number;
  title: string;
  description: string | null;
  priority?: string;
  goalId?: number | null;
  journalEntryId?: number; // Reference to the source journal entry
  explanation?: string;    // AI's explanation for the suggestion
  createdAt: string;
  userId: number;
  dueDate?: string | null;
}

interface AISuggestedHabit {
  id: number;
  title: string;
  description: string | null;
  frequency?: string;
  journalEntryId?: number; // Reference to the source journal entry
  explanation?: string;    // AI's explanation for the suggestion
  createdAt: string;
  userId: number;
}

// AI suggestions are now fetched from the server API
// and filtered in the component to remove duplicates

// Extended types for items in the recycle bin
interface DeletedGoal extends Goal {
  deletedAt: string;
}

interface DeletedHabit {
  id: number;
  title: string;
  description: string | null;
  frequency: string;
  streak: number;
  userId: number;
  completedToday: boolean;
  deletedAt: string;
}

interface Task {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  completedAt: string | null;
  goalId: number | null;
  deletedAt?: string; // For deleted tasks in the recycle bin
}

import { 
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Edit,
  Lightbulb,
  Filter,
  CalendarDays,
  SortAsc,
  SortDesc,
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
  X,
  ListChecks,
  ClipboardList,
  MoreHorizontal,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Folder as FolderIcon,
  ListTodo
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import AISuggestions from "@/components/goals/ai-suggestions";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Goal categories
const GOAL_CATEGORIES = [
  "Personal",
  "Health",
  "Learning",
  "Career",
  "Relationships",
  "Financial",
  "Other"
];

// Constants for form validation
const MAX_DESCRIPTION_LENGTH = 500;

// Goal schema with zod validation
const goalSchema = z.object({
  name: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  category: z.string(),
  target: z.number().min(0),
  progress: z.number().min(0),
  unit: z.string(),
  colorScheme: z.number().optional(),
  userId: z.number().optional(),
});

// Habit schema with zod validation
const habitSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  userId: z.number(),
});

// Form value types
type GoalFormValues = z.infer<typeof goalSchema>;
type HabitFormValues = z.infer<typeof habitSchema>;

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [showNewHabitDialog, setShowNewHabitDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [newTaskInitialData, setNewTaskInitialData] = useState<{
    title?: string;
    description?: string;
    priority?: string;
    goalId?: number;
  }>({});
  const [activeTab, setActiveTab] = useState<string>("goals");
  
  // The AI suggestion data is defined at the top of the file
  
  // State for goals tab filtering
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<string | null>(null);
  const [goalDateRange, setGoalDateRange] = useState<{ from: Date | undefined; to: Date | undefined; }>({
    from: undefined,
    to: undefined,
  });
  const [goalDateRangeOpen, setGoalDateRangeOpen] = useState(false);
  const [goalDateFilterActive, setGoalDateFilterActive] = useState(false);
  const [goalSortBy, setGoalSortBy] = useState<'targetDate' | 'progress' | 'createdAt'>('targetDate');
  const [goalSortDirection, setGoalSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Task filtering states
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [taskSortBy, setTaskSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [taskSortDirection, setTaskSortDirection] = useState<'asc' | 'desc'>('asc');
  const [taskDateRangeOpen, setTaskDateRangeOpen] = useState(false);
  const [taskDateRange, setTaskDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [taskDateFilterActive, setTaskDateFilterActive] = useState(false);
  const [taskSelectedGoalId, setTaskSelectedGoalId] = useState<number | null>(null);
  
  // Fetch goals data
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch all tasks for displaying under goals
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch habits data
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: [`/api/habits/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch AI-suggested goals, tasks and habits
  const { data: aiSuggestions = { goals: [], tasks: [], habits: [] }, isLoading: isSuggestionsLoading, refetch: refetchSuggestions } = useQuery<{ goals: AISuggestedGoal[], tasks: AISuggestedTask[], habits: AISuggestedHabit[] }>({
    queryKey: [`/api/goals/${user?.id}/ai-suggestions`],
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes - these don't change as frequently
  });

  // Delete goal mutation
  const convertGoalToTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      // Convert goal to task using the new API endpoint
      const response = await apiRequest("POST", `/api/goals/${id}/convert-to-task`);
      if (!response.ok) {
        throw new Error("Failed to convert goal to task");
      }
      return response.json();
    },
    onSuccess: async () => {
      // Use the correct query key format to match other queries in the file
      await queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      
      // Also invalidate using array format for compatibility
      await queryClient.invalidateQueries({ queryKey: ['/api/goals', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', user?.id] });
      
      // Force refetch to update the UI
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/goals/${user?.id}`] }),
        queryClient.refetchQueries({ queryKey: [`/api/tasks/${user?.id}`] })
      ]);
      
      toast({
        title: "Goal converted",
        description: "Goal has been converted to a task successfully.",
      });
      
      // Switch to tasks tab to show the newly created task
      setActiveTab("tasks");
    },
    onError: (error) => {
      console.error("Failed to convert goal to task:", error);
      toast({
        title: "Error",
        description: "Failed to convert goal to task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      // Proceed with deletion from database
      const res = await apiRequest("DELETE", `/api/goals/${id}`);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate both regular goals and deleted goals queries
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/deleted`] });
      toast({
        title: "Goal moved to recycle bin",
        description: "The goal has been moved to recycle bin",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the goal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Accept/reject AI goal suggestion mutations
  const acceptGoalSuggestionMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const res = await apiRequest("POST", `/api/ai-goals/${goalId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Goal added successfully",
        description: "The suggested goal has been added to your goals.",
        variant: "default",
      });
      // Invalidate goals query and manually refetch suggestions
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      // Refetch suggestion data to keep other suggestions
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add goal",
        description: "There was an error adding the suggested goal.",
        variant: "destructive",
      });
    },
  });

  const rejectGoalSuggestionMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-goals/${goalId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion removed",
        description: "The goal suggestion has been removed.",
        variant: "default",
      });
      // Invalidate suggestions query
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the goal suggestion.",
        variant: "destructive",
      });
    },
  });
  
  // Accept/reject AI task suggestion mutations
  const acceptTaskSuggestionMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/ai-tasks/${taskId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task added successfully",
        description: "The suggested task has been added to your tasks.",
        variant: "default",
      });
      // Invalidate tasks query and manually refetch suggestions
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add task",
        description: "There was an error adding the suggested task.",
        variant: "destructive",
      });
    },
  });

  const rejectTaskSuggestionMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-tasks/${taskId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion removed",
        description: "The task suggestion has been removed.",
        variant: "default",
      });
      // Invalidate suggestions query
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the task suggestion.",
        variant: "destructive",
      });
    },
  });
  
  // Accept/reject AI habit suggestion mutations
  const acceptHabitSuggestionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("POST", `/api/ai-habits/${habitId}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit added successfully",
        description: "The suggested habit has been added to your habits.",
        variant: "default",
      });
      // Invalidate habits query and manually refetch suggestions
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add habit",
        description: "There was an error adding the suggested habit.",
        variant: "destructive",
      });
    },
  });

  const rejectHabitSuggestionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("DELETE", `/api/ai-habits/${habitId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion removed",
        description: "The habit suggestion has been removed.",
        variant: "default",
      });
      // Invalidate suggestions query
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/ai-suggestions`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove suggestion",
        description: "There was an error removing the habit suggestion.",
        variant: "destructive",
      });
    },
  });
  
  // Suggestions generation is now handled by the AISuggestions component

  // Suggestion filtering is now handled by the AISuggestions component
  
  // Helper function to determine a category for a goal
  const getGoalCategory = (goalName: string): string => {
    const name = goalName.toLowerCase();
    if (name.includes('read') || name.includes('learn') || name.includes('study')) 
      return 'Learning';
    if (name.includes('exercise') || name.includes('workout') || name.includes('run') || name.includes('meditate'))
      return 'Health';
    if (name.includes('save') || name.includes('budget') || name.includes('invest'))
      return 'Financial';
    if (name.includes('family') || name.includes('friend') || name.includes('relationship'))
      return 'Relationships';
    if (name.includes('job') || name.includes('career') || name.includes('work'))
      return 'Career';
    return 'Personal';
  };
  
  // Recycle bin states
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  
  // Fetch deleted goals from the API
  const { data: deletedGoalsData = [] } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${user?.id}/deleted`],
    enabled: !!user?.id && showRecycleBin,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch deleted tasks from the API
  const { data: deletedTasksData = [] } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${user?.id}/deleted`],
    enabled: !!user?.id && showRecycleBin,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch deleted habits from the API
  const { data: deletedHabitsData = [] } = useQuery<Habit[]>({
    queryKey: [`/api/habits/${user?.id}/deleted`],
    enabled: !!user?.id && showRecycleBin,
    staleTime: 60000, // 1 minute
  });
  
  // Use fetched data for deleted items
  const deletedGoals = deletedGoalsData;
  const deletedTasks = deletedTasksData;
  const deletedHabits = deletedHabitsData;
  
  // Helper function for clearing date filters
  const clearTaskDateFilter = () => {
    setTaskDateRange({ from: undefined, to: undefined });
    setTaskDateFilterActive(false);
  };
  
  // Group goals by category (for display purposes)
  const goalsByCategory = goals.reduce((acc, goal) => {
    const category = goal.category || "Other";
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push(goal);
    return acc;
  }, {} as Record<string, Goal[]>);
  
  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goal: GoalFormValues) => {
      const res = await apiRequest("POST", "/api/goals", goal);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
      // Reset the form to clear previous inputs
      goalForm.reset({
        name: "",
        description: "",
        targetDate: "",
        category: "Personal",
        target: 100,
        progress: 0,
        unit: "%",
        colorScheme: 1,
        userId: user?.id
      });
      setShowNewGoalDialog(false);
      toast({
        title: "Goal created",
        description: "Your goal has been successfully created",
      });
    },
    onError: (error) => {
      console.error("Error creating goal:", error);
      toast({
        title: "Creation failed",
        description: "There was an error creating your goal. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: async (habit: HabitFormValues) => {
      const res = await apiRequest("POST", "/api/habits", habit);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
      setShowNewHabitDialog(false);
      toast({
        title: "Habit created",
        description: "Your habit has been successfully created",
      });
    },
    onError: (error) => {
      console.error("Error creating habit:", error);
      toast({
        title: "Creation failed",
        description: "There was an error creating your habit. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Toggle habit completion mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/habits/${id}/toggle`, { completed });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
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
  
  // Goal form setup
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
  
  // Handle goal submission
  const onGoalSubmit = (values: GoalFormValues) => {
    if (!user) return;
    
    values.userId = user.id;
    
    // Check if a similar goal exists
    const similarGoal = goals.find(g => 
      g.name.toLowerCase() === values.name.toLowerCase() ||
      g.name.toLowerCase().includes(values.name.toLowerCase())
    );
    
    if (similarGoal) {
      if (window.confirm(`A similar goal "${similarGoal.name}" already exists. Do you still want to create this goal?`)) {
        addGoalMutation.mutate(values);
      } else {
        setShowNewGoalDialog(false);
      }
    } else {
      addGoalMutation.mutate(values);
    }
  };
  
  // Habit form setup
  const [newHabit, setNewHabit] = useState({
    title: "",
    description: "",
    frequency: "daily",
    userId: user?.id
  });
  
  // Handle habit submission
  const onHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!newHabit.title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your habit",
        variant: "destructive"
      });
      return;
    }
    
    const values = {
      ...newHabit,
      userId: user.id
    };
    
    // Check if a similar habit exists
    const similarHabit = habits.find(h => 
      h.title.toLowerCase() === values.title.toLowerCase() ||
      h.title.toLowerCase().includes(values.title.toLowerCase())
    );
    
    if (similarHabit) {
      if (window.confirm(`A similar habit "${similarHabit.title}" already exists. Do you still want to create this habit?`)) {
        addHabitMutation.mutate(values as HabitFormValues);
        // Note: The dialog is closed in addHabitMutation.onSuccess
      } else {
        // User canceled, so we just close the dialog
        setShowNewHabitDialog(false);
        // Reset form for next time
        setNewHabit({
          title: "",
          description: "",
          frequency: "daily",
          userId: user?.id
        });
      }
    } else {
      // No similar habit, proceed with creation
      addHabitMutation.mutate(values as HabitFormValues);
      // Note: The dialog is closed in addHabitMutation.onSuccess
    }
  };
  
  // Toggle habit completion
  const toggleHabitCompletion = (id: number) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    toggleHabitMutation.mutate({
      id,
      completed: !habit.completedToday
    });
  };
  
  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/habits/${id}`);
      return id;
    },
    onSuccess: () => {
      // Invalidate both regular habits and deleted habits queries
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}/deleted`] });
      toast({
        title: "Habit moved to recycle bin",
        description: "You can restore this habit within 7 days",
      });
    },
  });
  
  // Update habit  
  const updateHabitMutation = useMutation({
    mutationFn: async (habit: Partial<Habit> & { id: number }) => {
      const { id, ...data } = habit;
      const res = await apiRequest("PATCH", `/api/habits/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
      setShowEditHabitDialog(false);
      toast({
        title: "Habit updated",
        description: "Your habit has been successfully updated",
      });
    },
  });
  
  // Helper function for updating habits
  const updateHabit = (updatedHabit: Habit) => {
    updateHabitMutation.mutate(updatedHabit);
  };
  
  // Edit habit dialog state
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [showEditHabitDialog, setShowEditHabitDialog] = useState(false);
  
  // Premium status (for demonstration)
  const isPremiumUser = true; // This would come from a user's subscription status
  
  // Determine if it's premium feature
  const isPremiumFeature = (feature: string) => {
    const premiumFeatures = [
      "goal-attachments",
      "unlimited-habits",
      "advanced-analytics",
      "30-day-recycle-bin"
    ];
    
    return premiumFeatures.includes(feature) && !isPremiumUser;
  };
  
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
              {(deletedGoals.length > 0 || deletedTasks.length > 0 || deletedHabits.length > 0) && (
                <Badge className="ml-1 bg-[#f096c9] text-white">
                  {deletedGoals.length + deletedTasks.length + deletedHabits.length}
                </Badge>
              )}
            </Button>
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
              {deletedGoals.length === 0 && deletedTasks.length === 0 && deletedHabits.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p>Recycle bin is empty</p>
                </div>
              )}
              
              {/* Deleted Habits Section */}
              {deletedHabits.length > 0 && (
                <div className="py-4">
                  <h3 className="font-medium mb-4">Deleted Habits</h3>
                  <div className="space-y-3">
                    {deletedHabits.map(habit => (
                      <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium">{habit.title}</p>
                          {habit.description && <p className="text-sm text-gray-500">{habit.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            Deleted on {new Date(habit.deletedAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white"
                          onClick={() => {
                            // Call the restore endpoint
                            fetch(`/api/habits/${habit.id}/restore`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            })
                            .then(res => {
                              if (res.ok) {
                                // Invalidate both queries
                                queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}`] });
                                queryClient.invalidateQueries({ queryKey: [`/api/habits/${user?.id}/deleted`] });
                                toast({
                                  title: "Habit restored",
                                  description: "Your habit has been successfully restored",
                                });
                              } else {
                                throw new Error('Failed to restore habit');
                              }
                            })
                            .catch(error => {
                              console.error('Error restoring habit:', error);
                              toast({
                                title: "Restore failed",
                                description: "There was an error restoring your habit. Please try again.",
                                variant: "destructive"
                              });
                            });
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Deleted Goals Section */}
              {deletedGoals.length > 0 && (
                <div className="py-4">
                  <h3 className="font-medium mb-4">Deleted Goals</h3>
                  <div className="space-y-3">
                    {deletedGoals.map(goal => (
                      <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          {goal.description && <p className="text-sm text-gray-500">{goal.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            Deleted on {new Date(goal.deletedAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white"
                          onClick={() => {
                            // Call the restore endpoint
                            fetch(`/api/goals/${goal.id}/restore`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            })
                            .then(res => {
                              if (res.ok) {
                                // Invalidate both queries
                                queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}`] });
                                queryClient.invalidateQueries({ queryKey: [`/api/goals/${user?.id}/deleted`] });
                                toast({
                                  title: "Goal restored",
                                  description: "Your goal has been successfully restored",
                                });
                              } else {
                                throw new Error('Failed to restore goal');
                              }
                            })
                            .catch(error => {
                              console.error('Error restoring goal:', error);
                              toast({
                                title: "Restore failed",
                                description: "There was an error restoring your goal. Please try again.",
                                variant: "destructive"
                              });
                            });
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Deleted Tasks Section */}
              {deletedTasks.length > 0 && (
                <div className="py-4">
                  <h3 className="font-medium mb-4">Deleted Tasks</h3>
                  <div className="space-y-3">
                    {deletedTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                          <div className="flex items-center mt-1 text-xs text-gray-400">
                            <p>Deleted on {new Date(task.deletedAt as string).toLocaleDateString()}</p>
                            {task.goalId && (
                              <p className="ml-3">
                                <FolderIcon className="h-3 w-3 inline mr-1" />
                                Goal: {goals.find(g => g.id === task.goalId)?.name || "Unknown"}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white"
                          onClick={() => {
                            // Call the restore endpoint
                            fetch(`/api/tasks/${task.id}/restore`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            })
                            .then(res => {
                              if (res.ok) {
                                // Invalidate both queries
                                queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
                                queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}/deleted`] });
                                // Switch to the tasks tab
                                setActiveTab("tasks");
                                toast({
                                  title: "Task restored",
                                  description: "Your task has been successfully restored",
                                });
                              } else {
                                throw new Error('Failed to restore task');
                              }
                            })
                            .catch(error => {
                              console.error('Error restoring task:', error);
                              toast({
                                title: "Restore failed",
                                description: "There was an error restoring your task. Please try again.",
                                variant: "destructive"
                              });
                            });
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="goals" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted w-full justify-start mb-6">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>
          
          {/* Goal Dialog */}
          <Dialog 
            open={showNewGoalDialog} 
            onOpenChange={(open) => {
              // Reset form when opening the dialog
              if (open) {
                goalForm.reset({
                  name: "",
                  description: "",
                  targetDate: "",
                  category: "Personal",
                  target: 100,
                  progress: 0,
                  unit: "%",
                  colorScheme: 1,
                  userId: user?.id
                });
              }
              setShowNewGoalDialog(open);
            }}
          >
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
                          <Input 
                            placeholder="Brief description of your goal" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
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
                            <Input 
                              type="date" 
                              className="bg-white"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
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
          
          <TabsContent value="goals">
            {/* Add Goal button */}
            <div className="flex justify-end mb-6">
              <Button 
                onClick={() => setShowNewGoalDialog(true)}
                className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Goal
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* AI Suggestions Section */}
              <div className="md:col-span-1">
                <AISuggestions 
                  existingGoals={goals} 
                  existingTasks={allTasks} 
                  existingHabits={habits}
                  activeTab={activeTab} 
                />
              </div>
              <Card className="md:col-span-3 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Your Goals</CardTitle>
                  <CardDescription>
                    Track and achieve your personal objectives
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                
                  {/* Advanced Filtering UI for Goals */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Category Filter Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Filter className="h-4 w-4" />
                            {goalCategoryFilter === null 
                              ? "Filter by Category" 
                              : `Category: ${goalCategoryFilter}`}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Select a Category</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setGoalCategoryFilter(null)}>
                            All Categories
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {Array.from(new Set(goals.map(goal => goal.category))).map((category) => (
                            <DropdownMenuItem key={category} onClick={() => setGoalCategoryFilter(category)}>
                              {category}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Status Filter Tabs */}
                      <Tabs defaultValue={goalFilter} onValueChange={(value) => setGoalFilter(value)}>
                        <TabsList className="h-9">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                          <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                      {/* Date Range Filter */}
                      <Popover open={goalDateRangeOpen} onOpenChange={setGoalDateRangeOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant={goalDateFilterActive ? "default" : "outline"} 
                            size="sm" 
                            className={`gap-1 ${goalDateFilterActive ? "bg-[#9AAB63] hover:bg-[#8a9a58]" : ""}`}
                          >
                            <CalendarDays className="h-4 w-4" />
                            {goalDateFilterActive 
                              ? `${format(goalDateRange.from!, 'MMM d')}${goalDateRange.to ? ` - ${format(goalDateRange.to, 'MMM d')}` : ''}` 
                              : "Target Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-3 border-b">
                            <h3 className="font-medium text-sm">Select Date Range</h3>
                            <p className="text-xs text-muted-foreground mt-1">Filter goals by target date</p>
                          </div>
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            selected={{
                              from: goalDateRange.from,
                              to: goalDateRange.to,
                            }}
                            onSelect={(range) => {
                              // Ensure we handle the optional 'to' field properly
                              if (range) {
                                setGoalDateRange({ 
                                  from: range.from, 
                                  to: range.to || range.from 
                                });
                                setGoalDateFilterActive(true);
                              } else {
                                setGoalDateRange({ from: undefined, to: undefined });
                                setGoalDateFilterActive(false);
                              }
                            }}
                            numberOfMonths={2}
                          />
                          <div className="p-3 border-t">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setGoalDateRange({ from: undefined, to: undefined });
                                setGoalDateFilterActive(false);
                                setGoalDateRangeOpen(false);
                              }}
                            >
                              Clear Filter
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Sort Order Controls */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="goal-sort" className="text-sm whitespace-nowrap">Sort by:</Label>
                      <Select
                        value={goalSortBy}
                        onValueChange={(value) => setGoalSortBy(value as any)}
                      >
                        <SelectTrigger id="goal-sort" className="w-[140px] h-9">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="targetDate">Target Date</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setGoalSortDirection(goalSortDirection === 'asc' ? 'desc' : 'asc')}
                      >
                        {goalSortDirection === 'asc' ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
                    </div>
                  ) : goals.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(goalsByCategory)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([category, categoryGoals]) => (
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
                                  <div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="bg-white">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            // setGoalToEdit(goal);
                                            // setShowEditGoalDialog(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            convertGoalToTaskMutation.mutate(goal.id);
                                            // Switch to tasks tab to show the new task when conversion is successful
                                            if (!convertGoalToTaskMutation.isPending && !convertGoalToTaskMutation.isError) {
                                              setActiveTab("tasks");
                                            }
                                          }}
                                          disabled={convertGoalToTaskMutation.isPending}
                                        >
                                          <ClipboardList className="h-4 w-4 mr-2" />
                                          <span>
                                            {convertGoalToTaskMutation.isPending 
                                              ? "Converting..." 
                                              : "Convert to Task"}
                                          </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            deleteGoalMutation.mutate(goal.id);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          <span>Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                
                                {goal.description && (
                                  <p className="text-sm text-gray-600 mb-3">
                                    {goal.description}
                                  </p>
                                )}
                                
                                <div className="mb-2">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{goal.progress}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#9AAB63] transition-all duration-300" 
                                      style={{ width: `${goal.progress}%` }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  {goal.targetDate ? (
                                    <div className="flex items-center">
                                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                      <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                                      <span>No deadline</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Related tasks */}
                                {allTasks.filter(t => t.goalId === goal.id).length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center text-sm font-medium mb-2">
                                      <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-[#9AAB63]" />
                                      <span>Related Tasks</span>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                      {allTasks
                                        .filter(t => t.goalId === goal.id)
                                        .slice(0, 3)
                                        .map(task => (
                                          <div key={task.id} className="flex items-center text-sm">
                                            <div 
                                              className={`w-3 h-3 rounded-full mr-2 ${
                                                task.status === "completed" 
                                                  ? "bg-[#9AAB63]" 
                                                  : task.priority === "high" 
                                                    ? "bg-[#F5B8DB]" 
                                                    : "bg-gray-200"
                                              }`}
                                            />
                                            <span className={`${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
                                              {task.title}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                    
                                    {allTasks.filter(t => t.goalId === goal.id).length > 3 && (
                                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                                        <span className="mr-1">
                                          +{allTasks.filter(t => t.goalId === goal.id).length - 3} more tasks
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-gray-50 rounded-full p-4 mb-4">
                        <Target className="h-10 w-10 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                      <p className="text-gray-500 mb-6 max-w-sm">
                        Create your first goal to start tracking your progress toward your objectives
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
            </div>
          </TabsContent>
          
          <TabsContent value="tasks">
            {/* Add Task button */}
            <div className="flex justify-end mb-6">
              <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#9AAB63] hover:bg-[#8a9a58] text-white"
                    onClick={() => {
                      // Clear any existing task data when manually clicking the button
                      setNewTaskInitialData({});
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-['Montserrat_Variable']">Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a task to track your day-to-day activities
                    </DialogDescription>
                  </DialogHeader>
                  <TaskForm 
                    userId={user?.id || 0}
                    initialData={undefined}
                    onSuccess={() => {
                      // Clear the initial data after successful submission
                      setNewTaskInitialData({});
                      // Close the dialog
                      setShowNewTaskDialog(false);
                      // Refresh the task list
                      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${user?.id}`] });
                      queryClient.invalidateQueries({ queryKey: ['/api/tasks', user?.id] });
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* AI Task Suggestions */}
              <Card className="md:col-span-1 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-[#B6CAEB]" />
                    Task Ideas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    AI-suggested tasks based on your journal entries
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center p-4">
                      <p className="text-gray-500">
                        Suggestions will appear in the AI Suggestions panel
                      </p>
                      <div className="flex items-center justify-center mt-3">
                        <AlertCircle className="h-4 w-4 mr-2 text-[#B6CAEB]" />
                        <span className="text-xs text-gray-500">Suggestions are generated automatically</span>
                      </div>
                    </div>
                    
                    {/* Generate suggestions button removed - now in AISuggestions component */}
                  </div>
                </CardContent>
              </Card>

              {/* Main Tasks Card */}
              <Card className="md:col-span-3 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Your Tasks</CardTitle>
                  <CardDescription>
                    Manage and track your day-to-day tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                {/* Advanced Filtering UI for Tasks */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Goal Filter Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Filter className="h-4 w-4" />
                          {taskSelectedGoalId === null 
                            ? "Filter by Goal" 
                            : taskSelectedGoalId === 0 
                              ? "Tasks without Goal" 
                              : `Goal: ${goals.find(g => g.id === taskSelectedGoalId)?.name?.substring(0, 15) || "Selected"}`}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Select a Goal</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTaskSelectedGoalId(null)}>
                          All Tasks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTaskSelectedGoalId(0)}>
                          Tasks without goal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {goals.map((goal) => (
                          <DropdownMenuItem key={goal.id} onClick={() => setTaskSelectedGoalId(goal.id)}>
                            {goal.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Status Filter Tabs */}
                    <Tabs defaultValue={taskFilter} onValueChange={(value) => setTaskFilter(value)}>
                      <TabsList className="h-9">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    {/* Date Range Filter */}
                    <Popover open={taskDateRangeOpen} onOpenChange={setTaskDateRangeOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant={taskDateFilterActive ? "default" : "outline"} 
                          size="sm" 
                          className={`gap-1 ${taskDateFilterActive ? "bg-[#9AAB63] hover:bg-[#8a9a58]" : ""}`}
                        >
                          <CalendarDays className="h-4 w-4" />
                          {taskDateFilterActive 
                            ? `${format(taskDateRange.from!, 'MMM d')}${taskDateRange.to ? ` - ${format(taskDateRange.to, 'MMM d')}` : ''}` 
                            : "Date Range"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b">
                          <h3 className="font-medium text-sm">Select Date Range</h3>
                          <p className="text-xs text-muted-foreground mt-1">Filter tasks by due date</p>
                        </div>
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          selected={{
                            from: taskDateRange.from,
                            to: taskDateRange.to
                          }}
                          onSelect={(range) => {
                            if (range) {
                              setTaskDateRange({
                                from: range.from,
                                to: range.to || range.from
                              });
                              setTaskDateFilterActive(!!range.from);
                            } else {
                              setTaskDateRange({ from: undefined, to: undefined });
                              setTaskDateFilterActive(false);
                            }
                          }}
                          numberOfMonths={1}
                          disabled={{ before: subDays(new Date(), 365), after: addDays(new Date(), 365) }}
                        />
                        {taskDateFilterActive && (
                          <div className="p-3 border-t flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={clearTaskDateFilter}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Sort Options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          {taskSortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                          Sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Sort Tasks</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuGroup>
                          <DropdownMenuRadioGroup value={taskSortBy} onValueChange={(value) => setTaskSortBy(value as any)}>
                            <DropdownMenuRadioItem value="dueDate">
                              <CalendarDays className="h-4 w-4 mr-2" />
                              Due Date
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="priority">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Priority
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="createdAt">
                              <Clock className="h-4 w-4 mr-2" />
                              Date Created
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => setTaskSortDirection(taskSortDirection === 'asc' ? 'desc' : 'asc')}>
                          {taskSortDirection === 'asc' ? (
                            <>
                              <SortAsc className="h-4 w-4 mr-2" />
                              Ascending
                            </>
                          ) : (
                            <>
                              <SortDesc className="h-4 w-4 mr-2" />
                              Descending
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {user && <TaskList 
                  userId={user.id} 
                  selectedGoalId={taskSelectedGoalId} 
                  statusFilter={taskFilter === "all" ? undefined : taskFilter as "completed" | "pending"} 
                  sortBy={taskSortBy}
                  sortDirection={taskSortDirection}
                  dateRange={taskDateFilterActive ? taskDateRange : undefined}
                />}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="habits">
            {/* Add Habit Button */}
            <div className="flex justify-end mb-6">
              <Dialog open={showNewHabitDialog} onOpenChange={setShowNewHabitDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[#B6CAEB] hover:bg-[#95b9e5] text-white"
                    onClick={() => {
                      // Clear any previous habit data when clicking Add Habit button directly
                      setNewHabit({
                        title: "",
                        description: "",
                        frequency: "daily",
                        userId: user?.id
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Habit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-['Montserrat_Variable']">Create New Habit</DialogTitle>
                    <DialogDescription>
                      Create a new habit to track regularly
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={onHabitSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="habit-title">Habit Name</Label>
                        <Input 
                          id="habit-title" 
                          placeholder="e.g. Morning meditation" 
                          value={newHabit.title}
                          onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="habit-description">Description (optional)</Label>
                        <Input 
                          id="habit-description" 
                          placeholder="Brief description of your habit" 
                          value={newHabit.description || ''}
                          onChange={(e) => setNewHabit({...newHabit, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="habit-frequency">Frequency</Label>
                        <Select 
                          onValueChange={(value) => setNewHabit({...newHabit, frequency: value as any})}
                          value={newHabit.frequency || "daily"}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select frequency" />
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
                        onClick={() => {
                          // Reset the form fields
                          setNewHabit({
                            title: "",
                            description: "",
                            frequency: "daily",
                            userId: user?.id
                          });
                          // Close the dialog
                          setShowNewHabitDialog(false);
                        }}
                        className="bg-white"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#B6CAEB] hover:bg-[#95b9e5] text-white"
                        disabled={addHabitMutation.isPending}
                      >
                        {addHabitMutation.isPending ? "Adding..." : "Add Habit"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* AI Habit Suggestions */}
              <Card className="md:col-span-1 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-[#B6CAEB]" />
                    Habit Ideas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    AI-suggested habits based on your journal entries
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {isSuggestionsLoading ? (
                      <div className="flex flex-col items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-[#9AAB63] mb-2" />
                        <p className="text-sm text-gray-500">Loading suggestions...</p>
                      </div>
                    ) : aiSuggestions.habits.length > 0 ? (
                      aiSuggestions.habits.slice(0, 3).map(habit => (
                        <div key={habit.id} className="bg-[#f8fff6] p-4 rounded-xl border border-[#9AAB63] border-opacity-30">
                          <h4 className="font-medium text-gray-800 text-sm mb-1">{habit.title}</h4>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{habit.description}</p>
                          <div className="flex justify-between gap-2">
                            <div className="flex flex-1">
                              <Button 
                                onClick={() => {
                                  // Accept the habit using the proper mutation to remove it from suggestions
                                  if (!user) return;
                                  
                                  // Call the accept mutation which will:
                                  // 1. Add the habit to the main habits table
                                  // 2. Delete it from the AI suggestions table
                                  acceptHabitSuggestionMutation.mutate(habit.id);
                                }}
                                className="bg-[#9AAB63] hover:bg-[#8a9a58] text-white text-xs px-3"
                                size="sm"
                                disabled={acceptHabitSuggestionMutation.isPending}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1.5" /> 
                                {acceptHabitSuggestionMutation.isPending ? "Adding..." : "Add Habit"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="bg-gray-50 rounded-full p-3 mb-3">
                          <Lightbulb className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 mb-2">No habit suggestions yet</p>
                        <p className="text-xs text-gray-400">
                          Write more in your journal to get AI-suggested habits
                        </p>
                      </div>
                    )}

                    {/* Generate suggestions button removed - now in AISuggestions component */}
                  </div>
                </CardContent>
              </Card>

              {/* Main Habits Card */}
              <Card className="md:col-span-3 bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] text-base">Your Habits</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {habits.length > 0 ? (
                    <div className="mt-4">
                      {habits.map(habit => (
                        <div key={habit.id} className="flex items-center justify-between bg-[#FFF8E8] p-3 rounded-md mb-3">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleHabitCompletion(habit.id)}
                              className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 border ${
                                habit.completedToday 
                                  ? 'border-[#9AAB63] bg-[#9AAB63] text-white' 
                                  : 'border-gray-300 bg-white hover:border-[#9AAB63]'
                              }`}
                            >
                              {habit.completedToday && <Check className="h-3 w-3" />}
                              </button>
                              
                              <div>
                                <h4 className="font-medium text-gray-800">{habit.title}</h4>
                                {habit.description && (
                                  <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                                )}
                                
                                <div className="flex items-center mt-2 gap-2">
                                  <Badge variant="outline" className="bg-white">
                                    {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                                  </Badge>
                                  
                                  {habit.streak > 0 && (
                                    <Badge className="bg-[#F5D867] text-gray-700">
                                      <Sparkles className="h-3 w-3 mr-1" />
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
                                  onClick={() => {
                                    deleteHabitMutation.mutate(habit.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-gray-50 rounded-full p-4 mb-4">
                        <Target className="h-10 w-10 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                      <p className="text-gray-500 mb-6 max-w-sm">
                        Create your first habit to start building consistency
                      </p>
                      <Button 
                        onClick={() => {
                          // Initialize with empty values
                          setNewHabit({
                            title: "",
                            description: "",
                            frequency: "daily",
                            userId: user?.id
                          });
                          setShowNewHabitDialog(true);
                        }}
                        className="bg-[#B6CAEB] hover:bg-[#95b9e5] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Create Your First Habit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable'] text-base">Habit Stats</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
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
                          <CalendarDays className="h-4 w-4 text-[#F5D867]" />
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
                          <TrendingUp className="h-4 w-4 text-[#F5B8DB]" />
                        </div>
                        <span className="text-sm">Monthly</span>
                      </div>
                      <span className="font-medium">
                        {habits.filter(h => h.frequency === "monthly").length}
                      </span>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center bg-[#FFF8E8] p-3 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[#9AAB63] bg-opacity-20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-[#9AAB63]" />
                        </div>
                        <span className="text-sm">Completed Today</span>
                      </div>
                      <span className="font-medium">
                        {habits.filter(h => h.completedToday).length}/{habits.length}
                      </span>
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