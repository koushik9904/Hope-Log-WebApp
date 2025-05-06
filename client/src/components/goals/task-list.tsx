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
  userId: number;
  selectedGoalId?: number | null;
  statusFilter?: 'all' | 'completed' | 'pending';
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export default function TaskList({ 
  userId, 
  selectedGoalId,
  statusFilter = 'all',
  sortBy = 'dueDate',
  sortDirection = 'asc',
  dateRange
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
        // First get all tasks for this goal
        const tasksRes = await fetch(`/api/tasks/goal/${goalId}`);
        if (!tasksRes.ok) {
          throw new Error('Failed to fetch goal tasks');
        }
        
        const goalTasks = await tasksRes.json();
        
        // Calculate new progress based on completed tasks
        const totalTasks = goalTasks.length;
        const completedTasks = completed 
          ? goalTasks.filter((t: Task) => t.completed || t.id === id).length
          : goalTasks.filter((t: Task) => t.completed && t.id !== id).length;
        
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Update the goal progress
        await apiRequest('PATCH', `/api/goals/${goalId}`, { progress });
      }
      
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      if (selectedGoalId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      if (selectedGoalId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', userId] });
      if (selectedGoalId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
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
    onSuccess: () => {
      // Use the correct query key format to match other queries in the application
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}/deleted`] });
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${userId}`] });
      
      if (selectedGoalId) {
        // For tasks in a specific goal
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
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
    if (!dateRange?.from) return true;
    if (!task.dueDate) return false; // No due date doesn't match date filter
    
    const taskDate = new Date(task.dueDate);
    
    if (dateRange.from && !dateRange.to) {
      return taskDate >= dateRange.from;
    }
    
    if (dateRange.from && dateRange.to) {
      const start = new Date(dateRange.from);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      
      return taskDate >= start && taskDate <= end;
    }
    
    return true;
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
  
  // Apply sorting
  filteredTasks = [...filteredTasks].sort((a, b) => {
    // Handle null values in sorting
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return sortDirection === 'asc' ? 1 : -1;
      if (!b.dueDate) return sortDirection === 'asc' ? -1 : 1;
      
      return sortDirection === 'asc'
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    
    if (sortBy === 'priority') {
      // Convert priority to numeric value for sorting
      const priorityValue = (priority: string) => {
        switch(priority?.toLowerCase()) {
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
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return sortDirection === 'asc' ? 1 : -1;
      if (!b.createdAt) return sortDirection === 'asc' ? -1 : 1;
      
      return sortDirection === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    return 0;
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
            <div key={priority} className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 font-['Montserrat_Variable']">
                {priority === 'High' && <AlertCircle className="h-4 w-4 text-red-500" />}
                {priority === 'Medium' && <BarChart3 className="h-4 w-4 text-orange-500" />}
                {priority === 'Low' && <ListTodo className="h-4 w-4 text-green-500" />}
                {priority !== 'High' && priority !== 'Medium' && priority !== 'Low' && <div className="w-4 h-4" />}
                {priority} Priority Tasks
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priorityTasks.map((task) => (
                  <Card key={task.id} className={`bg-white border-0 shadow-sm ${task.completed ? 'opacity-80' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`task-${task.id}`} 
                            checked={task.completed} 
                            onCheckedChange={() => handleToggleCompletion(task)}
                            className="h-5 w-5 border-2 border-[#9AAB63]"
                          />
                          <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleCompletion(task)}>
                              {task.completed ? (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Mark as incomplete
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as complete
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMoveDialog(task)}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Move to goal
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setTaskToConvert(task);
                                setNewGoalName(task.title);
                                setConvertToGoalDialogOpen(true);
                              }}
                            >
                              <Target className="mr-2 h-4 w-4" />
                              Convert to goal
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDelete(task)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-[#FFF8E8] p-4 rounded-xl mb-3">
                        {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </Badge>
                          )}
                          {task.goalId && goalsQuery.data && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              {goalsQuery.data.find((g) => g.id === task.goalId)?.name || 'Goal'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {task.completedAt && (
                        <div className="text-xs text-muted-foreground flex items-center mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Completed on {format(new Date(task.completedAt), 'MMM d, yyyy')}
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