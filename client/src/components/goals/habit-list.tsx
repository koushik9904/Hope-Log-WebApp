import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, Edit, Trash, Flame } from 'lucide-react';
import { Habit } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import HabitForm from './habit-form';

interface HabitListProps {
  userId: number;
}

export default function HabitList({ userId }: HabitListProps) {
  const { toast } = useToast();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // Fetch habits
  const habitsQuery = useQuery<Habit[]>({
    queryKey: ['/api/habits', userId],
    queryFn: async () => {
      const res = await fetch(`/api/habits/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch habits');
      return res.json();
    },
  });

  // Toggle habit completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest('PATCH', `/api/habits/${habitId}/toggle`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits', userId] });
      toast({
        title: 'Habit updated',
        description: 'Your habit completion status has been updated.',
      });
    },
    onError: (error) => {
      console.error('Failed to toggle habit completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update habit status.',
        variant: 'destructive',
      });
    },
  });

  // Delete a habit
  const deleteHabitMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits', userId] });
      toast({
        title: 'Habit deleted',
        description: 'The habit has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete habit. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleToggleCompletion = (habitId: number) => {
    toggleCompletionMutation.mutate(habitId);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const confirmDelete = (habit: Habit) => {
    setHabitToDelete(habit);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (habitToDelete) {
      deleteHabitMutation.mutate(habitToDelete.id);
    }
  };

  // Function to render the habit completion calendar
  const renderCalendar = (habit: Habit) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Convert completion history to a more usable format
    const completionHistory = habit.completionHistory || {};
    
    return (
      <div className="mt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500">
            {format(today, 'MMMM yyyy')}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {habit.streak > 0 ? `${habit.streak} day streak` : 'No current streak'}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={`header-${i}`} className="text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = !!completionHistory[dateStr];
            const isToday = isSameDay(day, today);
            
            return (
              <div
                key={`day-${i}`}
                className={`text-center text-xs rounded-full aspect-square flex items-center justify-center
                  ${isToday ? 'border border-dashed border-gray-300' : ''}
                  ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'}
                `}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">Daily</Badge>;
      case 'weekly':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Weekly</Badge>;
      case 'monthly':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Monthly</Badge>;
      default:
        return <Badge variant="outline">{frequency}</Badge>;
    }
  };

  const getHabitColorClass = (colorScheme: number) => {
    switch (colorScheme) {
      case 1: return 'border-l-[#F5B8DB]';
      case 2: return 'border-l-[#B6CAEB]';
      case 3: return 'border-l-[#9AAB63]';
      case 4: return 'border-l-[#F5D867]';
      default: return 'border-l-gray-300';
    }
  };

  if (habitsQuery.isLoading) {
    return <div className="flex justify-center p-8">Loading habits...</div>;
  }

  if (habitsQuery.error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error loading habits. Please try again.</p>
      </div>
    );
  }

  const habits = habitsQuery.data || [];

  return (
    <div className="space-y-4">
      {habits.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#B6CAEB]/10 flex items-center justify-center mb-4">
            <Flame className="h-6 w-6 text-[#B6CAEB]" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Habits Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first habit to start building consistent routines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <Card key={habit.id} className={`border-l-4 ${getHabitColorClass(habit.colorScheme || 1)}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {habit.title}
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
                      <DropdownMenuItem onClick={() => handleToggleCompletion(habit.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {habit.completedToday ? 'Mark as missed' : 'Mark as complete'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(habit)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => confirmDelete(habit)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {habit.description && <p className="text-sm text-muted-foreground mb-2">{habit.description}</p>}
                <div className="flex items-center gap-2 mb-2">
                  {getFrequencyBadge(habit.frequency)}
                  {habit.completedToday && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Done today
                    </Badge>
                  )}
                </div>
                {renderCalendar(habit)}
              </CardContent>
              <CardFooter className="pt-0">
                {habit.lastCompletedAt && (
                  <div className="text-xs text-muted-foreground">
                    Last completed: {format(new Date(habit.lastCompletedAt), 'PP')}
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Habit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <HabitForm
              initialData={editingHabit}
              userId={userId}
              onSuccess={() => setEditingHabit(null)}
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
              This will delete the habit "{habitToDelete?.title}" and all your tracking history for it. This action cannot be undone.
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
    </div>
  );
}