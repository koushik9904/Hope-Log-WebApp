import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Edit, Trash, Check, X, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Task, Goal } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
}

export default function TaskList({ userId, selectedGoalId }: TaskListProps) {
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [moveTaskDialogOpen, setMoveTaskDialogOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [selectedGoalForMove, setSelectedGoalForMove] = useState<number | null>(null);

  // Fetch tasks
  const tasksQuery = useQuery<Task[]>({
    queryKey: ['/api/tasks', userId, selectedGoalId],
    queryFn: async () => {
      const url = selectedGoalId
        ? `/api/tasks/goal/${selectedGoalId}`
        : `/api/tasks/${userId}`;
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
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest('PATCH', `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      if (selectedGoalId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/goal', selectedGoalId] });
      }
      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully.',
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

  const handleToggleCompletion = (task: Task) => {
    toggleCompletionMutation.mutate({ id: task.id, completed: !task.completed });
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

  const tasks = tasksQuery.data || [];

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">No tasks found. Create your first task to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className={`${task.completed ? 'bg-muted/50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </CardTitle>
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
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[600px]">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Move Task to Another Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select Goal:</h4>
              <div className="grid grid-cols-1 gap-2">
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
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMoveTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMoveTask}>
                Move Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}