import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Edit, Trash, Check, X, ArrowRight, Calendar, Clock, Target, Plus, Filter, AlertCircle, BarChart3, ListTodo } from 'lucide-react';
import { Task, Goal } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TaskForm from './task-form';

interface TaskListProps {
  tasks?: any[];
  isLoading?: boolean;
  selectedGoalId?: number | null;
  filter?: 'all' | 'completed' | 'pending';
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  isDateFilterActive?: boolean;
  isDateInRange?: (date: string | null | undefined) => boolean;
  setActiveTab?: (tab: string) => void; // Optional function to switch tabs in parent component
  userId?: number;
}

export default function TaskList({ 
  tasks: propTasks,
  isLoading: propIsLoading,
  selectedGoalId,
  filter = 'all',
  sortBy = 'dueDate',
  sortDirection = 'asc',
  isDateFilterActive = false,
  isDateInRange,
  setActiveTab,
  userId
}: TaskListProps) {
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [moveTaskDialogOpen, setMoveTaskDialogOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [selectedGoalForMove, setSelectedGoalForMove] = useState<number | null>(null);
  const [convertToGoalDialogOpen, setConvertToGoalDialogOpen] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState<Task | null>(null);
  const [newGoalName, setNewGoalName] = useState<string>("");
  const [isCreatingNewGoal, setIsCreatingNewGoal] = useState(false);

  // Fetch tasks
  const tasksQuery = useQuery<Task[]>({
    queryKey: ['/api/tasks', userId, selectedGoalId],
    queryFn: async () => {
      let url;
      if (selectedGoalId === null) {
        // All tasks
        url = `/api/tasks/${userId}`;
      } else if (selectedGoalId === 0) {
        // Tasks without a goal
        url = `/api/tasks/no-goal/${userId}`;
      } else {
        // Tasks for a specific goal
        url = `/api/tasks/goal/${selectedGoalId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  // Fetch goals for the move task dropdown
  const goalsQuery = useQuery<Goal[]>({
    queryKey: ['/api/goals', userId],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });

  // Toggle task completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ id, completed, goalId }: { id: number; completed: boolean; goalId?: number | null }) => {
      console.log(`Toggling task ${id} completion to ${completed}, goalId: ${goalId}`);
      
      // Add completedAt date when marking as completed
      const data: any = { completed };
      if (completed) {
        data.completedAt = new Date().toISOString();
      } else {
        data.completedAt = null;
      }
      
      const res = await apiRequest('PATCH', `/api/tasks/${id}`, data);
      const updatedTask = await res.json();
      
      // If task belongs to a goal, update the goal progress
      if (goalId && completed !== undefined) {
        console.log(`Task ${id} belongs to goal ${goalId}, updating goal progress...`);
        
        // First get all tasks for this goal
        const tasksRes = await fetch(`/api/tasks/goal/${goalId}`);
        if (!tasksRes.ok) {
          throw new Error('Failed to fetch goal tasks');
        }
        
        const goalTasks = await tasksRes.json();
        console.log(`Found ${goalTasks.length} tasks for goal ${goalId}`);
        
        // Calculate new progress based on completed tasks
        const totalTasks = goalTasks.length;
        const completedTasks = completed 
          ? goalTasks.filter((t: Task) => t.completed || t.id === id).length
          : goalTasks.filter((t: Task) => t.completed && t.id !== id).length;
        
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        console.log(`Goal ${goalId} new progress: ${progress}% (${completedTasks}/${totalTasks} tasks completed)`);
        
        // Update the goal progress
        await apiRequest('PATCH', `/api/goals/${goalId}`, { progress });
      }
      
      return updatedTask;
    },
    onSuccess: async (updatedTask) => {
      console.log('Task update successful:', updatedTask);
      
      // Invalidate and immediately refetch queries to ensure UI is up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      
      // Also make sure to use the string format as well
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}`] }); 
      await queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
      
      if (selectedGoalId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
      
      // If this task belongs to a goal, make sure to refetch the goals data
      if (updatedTask.goalId) {
        console.log(`Refetching data for goal ${updatedTask.goalId}`);
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', updatedTask.goalId] });
        const goalQueryKey = [`/api/goals/${updatedTask.goalId}`];
        await queryClient.invalidateQueries({ queryKey: goalQueryKey });
        
        // Force a refetch of goals data
        await queryClient.refetchQueries({ queryKey: ['/api/goals', userId] });
      }
    },
    onError: (error) => {
      console.error('Failed to toggle task completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    },
  });

  // Delete a task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      // Invalidate both regular tasks and deleted tasks queries
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}/deleted`] });
      
      if (selectedGoalId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
      
      toast({
        title: 'Task moved to recycle bin',
        description: 'The task has been moved to the recycle bin.',
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Move task to another goal
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, goalId }: { taskId: number; goalId: number | null }) => {
      const res = await apiRequest('PATCH', `/api/tasks/${taskId}`, { goalId });
      return res.json();
    },
    onSuccess: async (updatedTask) => {
      console.log('Task move successful:', updatedTask);
      
      // Invalidate and immediately refetch queries to ensure UI is up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      
      // Also make sure to use the string format as well
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}`] }); 
      await queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
      
      if (selectedGoalId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
      
      // If we moved to a new goal, make sure to refetch that goal's tasks
      if (updatedTask.goalId) {
        console.log(`Refetching tasks for goal ${updatedTask.goalId}`);
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', updatedTask.goalId] });
        await queryClient.refetchQueries({ queryKey: ['/api/tasks/goal', updatedTask.goalId] });
      }
      
      // Force a refetch of all relevant data
      await queryClient.refetchQueries({ queryKey: ['/api/tasks', userId] });
      await queryClient.refetchQueries({ queryKey: ['/api/goals', userId] });
        
      toast({
        title: 'Task moved',
        description: 'The task has been moved successfully.',
      });
      setMoveTaskDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to move task:', error);
      toast({
        title: 'Error',
        description: 'Failed to move task. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Create a new goal and move task to it
  const createGoalAndMoveMutation = useMutation({
    mutationFn: async ({ name, userId, target, progress, category, taskId }: {
      name: string;
      userId: number;
      target: number;
      progress: number;
      category: string;
      taskId: number;
    }) => {
      // First create the goal
      const createRes = await apiRequest('POST', '/api/goals', {
        name,
        userId,
        target,
        progress,
        category
      });
      
      if (!createRes.ok) {
        throw new Error('Failed to create goal');
      }
      
      const goal = await createRes.json();
      
      // Then move the task to the new goal
      const moveRes = await apiRequest('PATCH', `/api/tasks/${taskId}`, { 
        goalId: goal.id 
      });
      
      return moveRes.json();
    },
    onSuccess: async (updatedTask) => {
      console.log('Goal creation and task move successful:', updatedTask);
      
      // Invalidate and immediately refetch queries to ensure UI is up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      
      // Also make sure to use the string format as well
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}`] }); 
      await queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
      
      if (selectedGoalId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
      
      // If we moved to a new goal, make sure to refetch that goal's tasks
      if (updatedTask.goalId) {
        console.log(`Refetching tasks for new goal ${updatedTask.goalId}`);
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', updatedTask.goalId] });
        const goalQueryKey = [`/api/goals/${updatedTask.goalId}`];
        await queryClient.invalidateQueries({ queryKey: goalQueryKey });
        
        // Force a refetch of goals data
        await queryClient.refetchQueries({ queryKey: ['/api/goals', userId] });
        await queryClient.refetchQueries({ queryKey: ['/api/tasks/goal', updatedTask.goalId] });
      }
      
      toast({
        title: 'Goal created',
        description: 'New goal created and task moved successfully.',
      });
      setMoveTaskDialogOpen(false);
      setIsCreatingNewGoal(false);
    },
    onError: (error) => {
      console.error('Failed to create goal and move task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal and move task. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Convert task to goal
  const convertTaskToGoalMutation = useMutation({
    mutationFn: async ({ taskId, goalName, description, userId }: {
      taskId: number;
      goalName: string;
      description: string;
      userId: number;
    }) => {
      // Use the new conversion endpoint
      const response = await apiRequest('POST', `/api/tasks/${taskId}/convert-to-goal`);
      
      if (!response.ok) {
        throw new Error('Failed to convert task to goal');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Use the correct query key format to match other queries in the application
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}/deleted`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
      
      // Also refetch all tasks when using the array key format
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      
      if (selectedGoalId) {
        // For tasks in a specific goal
        await queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
      
      // Force refetch the tasksQuery data immediately 
      await tasksQuery.refetch();
      
      // Switch to the goals tab if setActiveTab is provided
      if (setActiveTab) {
        setActiveTab('goals');
      }
      
      toast({
        title: 'Task converted',
        description: 'Task has been converted to a goal successfully.',
      });
      
      setConvertToGoalDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to convert task to goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert task to goal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleToggleCompletion = (task: Task) => {
    toggleCompletionMutation.mutate({ 
      id: task.id, 
      completed: !task.completed,
      goalId: task.goalId
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const confirmDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  const openMoveDialog = (task: Task) => {
    setTaskToMove(task);
    setSelectedGoalForMove(task.goalId || null);
    setMoveTaskDialogOpen(true);
  };

  const handleMoveTask = () => {
    if (taskToMove) {
      moveTaskMutation.mutate({ taskId: taskToMove.id, goalId: selectedGoalForMove });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (tasksQuery.isLoading) {
    return <div className="flex justify-center p-8">Loading tasks...</div>;
  }

  if (tasksQuery.error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading tasks. Please try again.</p>
      </div>
    );
  }

  // Add date range check for tasks
  const isInDateRange = (task: Task) => {
    // If no date range filter is active, include all tasks
    if (!dateRange?.from) return true;
    
    // If task has no due date, don't include in date-filtered results
    if (!task.dueDate) return false;
    
    try {
      // Parse the ISO date string to a Date object, ensuring it's valid
      const taskDate = new Date(task.dueDate);
      
      // Validate the date is not invalid
      if (isNaN(taskDate.getTime())) {
        console.warn(`Invalid date found for task ${task.id}: "${task.dueDate}"`);
        return false;
      }
      
      // Normalize times for comparison (start of day)
      const taskDateNormalized = new Date(taskDate);
      taskDateNormalized.setHours(0, 0, 0, 0);
      
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      // From date only (on or after this date)
      if (dateRange.from && !dateRange.to) {
        console.log(`Checking date range: Task ${task.id} date ${taskDateNormalized} >= from ${fromDate}`);
        return taskDateNormalized >= fromDate;
      }
      
      // Date range (between from and to, inclusive)
      if (dateRange.from && dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // End of the day
        
        console.log(`Checking date range: Task ${task.id} date ${taskDateNormalized} between ${fromDate} and ${toDate}`);
        return taskDateNormalized >= fromDate && taskDateNormalized <= toDate;
      }
      
      return false; // If no conditions match, don't include the task
    } catch (error) {
      console.error(`Error filtering task ${task.id} by date range:`, error);
      return false;
    }
  };

  // Apply filters to tasks
  let filteredTasks = tasksQuery.data || [];
  
  // Apply status filter
  if (statusFilter === 'pending') {
    filteredTasks = filteredTasks.filter(task => !task.completed);
  } else if (statusFilter === 'completed') {
    filteredTasks = filteredTasks.filter(task => task.completed);
  }
  
  // Apply date range filter if active
  if (dateRange?.from) {
    filteredTasks = filteredTasks.filter(isInDateRange);
  }
  
  // Apply sorting - improved with error handling and validation
  filteredTasks = [...filteredTasks].sort((a, b) => {
    try {
      // Handle null values in sorting
      if (sortBy === 'dueDate') {
        // Handle missing due dates
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return sortDirection === 'asc' ? 1 : -1;
        if (!b.dueDate) return sortDirection === 'asc' ? -1 : 1;
        
        // Parse dates safely
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        
        // Check for invalid dates
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return sortDirection === 'asc' ? 1 : -1;
        if (isNaN(dateB.getTime())) return sortDirection === 'asc' ? -1 : 1;
        
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      
      if (sortBy === 'priority') {
        // Convert priority to numeric value for sorting with safe fallbacks
        const priorityValue = (priority: string) => {
          if (!priority) return 0;
          
          switch(priority.toLowerCase()) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
          }
        };
        
        const aValue = priorityValue(a.priority);
        const bValue = priorityValue(b.priority);
        
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
      
      if (sortBy === 'createdAt') {
        // Handle missing creation dates
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return sortDirection === 'asc' ? 1 : -1;
        if (!b.createdAt) return sortDirection === 'asc' ? -1 : 1;
        
        // Parse dates safely
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        
        // Check for invalid dates
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return sortDirection === 'asc' ? 1 : -1;
        if (isNaN(dateB.getTime())) return sortDirection === 'asc' ? -1 : 1;
        
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      
      // Default sort by title as a fallback
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } catch (error) {
      console.error("Error sorting tasks:", error);
      return 0;
    }
  });
  
  // Group tasks by priority (equivalent to grouping goals by category)
  const tasksByPriority = filteredTasks.reduce((acc, task) => {
    const priority = task.priority.charAt(0).toUpperCase() + task.priority.slice(1) || "Other";
    
    if (!acc[priority]) {
      acc[priority] = [];
    }
    
    acc[priority].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Calculate filter stats for displaying to user
  const totalTasks = tasksQuery.data?.length || 0;
  const filteredCount = filteredTasks.length;
  const isFiltered = 
    statusFilter !== 'all' || 
    dateRange?.from !== undefined || 
    selectedGoalId !== null;

  return (
    <div className="space-y-4">
      {/* Filter stats indicator */}
      {isFiltered && totalTasks > 0 && (
        <div className="bg-muted/20 px-4 py-2 rounded-md text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              Showing {filteredCount} of {totalTasks} tasks
              {statusFilter !== 'all' && 
                ` • ${statusFilter === 'completed' ? 'Completed' : 'Pending'} tasks`}
              {dateRange?.from && 
                ` • Due date filtered`}
            </span>
          </div>
        </div>
      )}
      
      {filteredTasks.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            {tasksQuery.data && tasksQuery.data.length > 0
              ? "No tasks match your current filters."
              : "No tasks found. Create your first task to get started!"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(tasksByPriority).map(([priority, priorityTasks]) => (
            <div key={priority} className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2 font-['Montserrat_Variable']">
                {priority === 'High' && <AlertCircle className="h-4 w-4 text-red-500" />}
                {priority === 'Medium' && <BarChart3 className="h-4 w-4 text-orange-500" />}
                {priority === 'Low' && <ListTodo className="h-4 w-4 text-green-500" />}
                {priority !== 'High' && priority !== 'Medium' && priority !== 'Low' && <div className="w-4 h-4" />}
                {priority} Priority Tasks
              </h3>
              
              <div className="space-y-1">
                {priorityTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between bg-[#FFF8E8] p-3 rounded-xl">
                    <div className="flex items-center gap-2 flex-1">
                      {/* Simple circular checkbox */}
                      <div 
                        onClick={() => handleToggleCompletion(task)} 
                        className="cursor-pointer"
                      >
                        {task.completed ? (
                          <div className="w-5 h-5 rounded-full bg-[#9AAB63] flex items-center justify-center text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-gray-300 bg-white"></div>
                        )}
                      </div>
                      
                      {/* Task title */}
                      <div className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </div>
                      
                      {/* Only show badges for goal and priority */}
                      {(task.goalId || task.priority) && (
                        <div className="flex items-center gap-1 ml-2">
                          <Badge variant="outline" className={`text-xs py-0 px-2 ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 
                            'bg-green-100 text-green-800'}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                          
                          {task.goalId && goalsQuery.data && (
                            <Badge variant="outline" className="text-xs py-0 px-2 bg-blue-100 text-blue-800">
                              {goalsQuery.data.find((g) => g.id === task.goalId)?.name || 'Goal'}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {/* Due date display */}
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 flex items-center mr-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                      
                      {/* Edit button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </Button>
                      
                      {/* Delete button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => confirmDelete(task)}
                      >
                        <Trash className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              initialData={editingTask}
              userId={userId}
              onSuccess={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the task "{taskToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Task Dialog */}
      <Dialog open={moveTaskDialogOpen} onOpenChange={setMoveTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] bg-white">
          <DialogHeader>
            <DialogTitle>Move Task to Another Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select Goal:</h4>
              
              {isCreatingNewGoal ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-goal-name">Goal Name</Label>
                    <Input 
                      id="new-goal-name" 
                      value={newGoalName} 
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="Enter goal name" 
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreatingNewGoal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        // Create goal and then move task
                        if (newGoalName && taskToMove) {
                          createGoalAndMoveMutation.mutate({
                            name: newGoalName,
                            userId: userId,
                            target: 100,
                            progress: 0,
                            category: "Personal",
                            taskId: taskToMove.id
                          });
                        }
                      }}
                      disabled={!newGoalName.trim()}
                    >
                      Create & Move
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[40vh]">
                    <div className="grid grid-cols-1 gap-2 pr-4">
                      <Button
                        key="no-goal"
                        variant={selectedGoalForMove === null ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setSelectedGoalForMove(null)}
                      >
                        No Goal (Independent Task)
                      </Button>
                      {goalsQuery.data?.map((goal) => (
                        <Button
                          key={goal.id}
                          variant={selectedGoalForMove === goal.id ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => setSelectedGoalForMove(goal.id)}
                        >
                          {goal.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Button 
                    onClick={() => {
                      setIsCreatingNewGoal(true);
                      setNewGoalName(taskToMove?.title || "");
                    }}
                    variant="outline" 
                    className="w-full mt-4 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Goal
                  </Button>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setMoveTaskDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleMoveTask}>
                      Move Task
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert Task to Goal Dialog */}
      <Dialog open={convertToGoalDialogOpen} onOpenChange={setConvertToGoalDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Convert Task to Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              Converting this task to a goal will create a new goal and delete the original task.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input 
                id="goal-name" 
                value={newGoalName} 
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="Enter goal name" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertToGoalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newGoalName && taskToConvert) {
                  convertTaskToGoalMutation.mutate({
                    taskId: taskToConvert.id,
                    goalName: newGoalName, // Not used by API but kept for type compatibility
                    description: taskToConvert.description || "", // Not used by API but kept for type compatibility
                    userId: userId // Not used by API but kept for type compatibility
                  });
                }
              }}
              disabled={!newGoalName.trim()}
            >
              Convert to Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}