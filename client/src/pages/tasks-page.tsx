import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Filter, SortAsc, SortDesc, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Goal } from '@shared/schema';
import TaskList from '@/components/goals/task-list';
import TaskForm from '@/components/goals/task-form';
import AISuggestions from '@/components/goals/ai-suggestions';
import PageHeader from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  // Fetch tasks
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['/api/tasks', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  // Fetch goals for filter dropdown
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/goals/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });

  // Helper function for clearing date filters
  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    setDateFilterActive(false);
  };

  // Helper function to check if a date is within the selected range
  const isDateInRange = (date: string | null | undefined) => {
    if (!date || !dateRange.from) return true; // If no date or no filter, include it

    const taskDate = new Date(date);

    if (dateRange.from && !dateRange.to) {
      // If only "from" date is set, check if task date is after or equal to "from"
      return taskDate >= startOfDay(dateRange.from);
    }

    if (dateRange.from && dateRange.to) {
      // If both "from" and "to" dates are set, check if task date is within the range
      return isWithinInterval(taskDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    }

    return true;
  };

  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Get task data for AI suggestions component
  const typedTasks = tasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
  }));

  return (
    <DashboardLayout>
      <div className="container p-4 mx-auto">
        <PageHeader
          title="Tasks"
          description="Manage your tasks and track your daily progress"
          className="mb-8"
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Goal Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  {selectedGoalId === null 
                    ? "Filter by Goal" 
                    : selectedGoalId === 0 
                      ? "Tasks without Goal" 
                      : `Goal: ${goals.find(g => g.id === selectedGoalId)?.name?.substring(0, 15) || "Selected"}`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select a Goal</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedGoalId(null)}>
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGoalId(0)}>
                  Tasks without goal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {goals.map((goal) => (
                  <DropdownMenuItem key={goal.id} onClick={() => setSelectedGoalId(goal.id)}>
                    {goal.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter Tabs */}
            <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Date Range Filter */}
            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={dateFilterActive ? "default" : "outline"} 
                  size="sm" 
                  className={`gap-1 ${dateFilterActive ? "bg-[#9AAB63] hover:bg-[#8a9a58]" : ""}`}
                >
                  <CalendarDays className="h-4 w-4" />
                  {dateFilterActive 
                    ? `${format(dateRange.from!, 'MMM d')}${dateRange.to ? ` - ${format(dateRange.to, 'MMM d')}` : ''}` 
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
                    from: dateRange.from,
                    to: dateRange.to
                  }}
                  onSelect={(range) => {
                    if (range) {
                      setDateRange({
                        from: range.from,
                        to: range.to || range.from
                      });
                      setDateFilterActive(!!range.from);
                    } else {
                      setDateRange({ from: undefined, to: undefined });
                      setDateFilterActive(false);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={{ before: subDays(new Date(), 365), after: addDays(new Date(), 365) }}
                />
                {dateFilterActive && (
                  <div className="p-3 border-t flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearDateFilter}
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
                  {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort Tasks</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('dueDate')}
                    className={sortBy === 'dueDate' ? 'bg-accent' : ''}
                  >
                    By Due Date
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('priority')}
                    className={sortBy === 'priority' ? 'bg-accent' : ''}
                  >
                    By Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('createdAt')}
                    className={sortBy === 'createdAt' ? 'bg-accent' : ''}
                  >
                    By Creation Date
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                  {sortDirection === 'asc' ? (
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

          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Main content area with AI suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* AI Suggestions Section */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-lg font-bold">AI Suggestions</CardTitle>
                <CardDescription>
                  Tasks based on your journal
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Use the TaskAISuggestions component to fix missing tasks */}
                <TaskAISuggestions 
                  existingTaskTitles={typedTasks.map(task => task.title)}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Tasks Section */}
          <Card className="md:col-span-3 bg-white border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="font-['Montserrat_Variable'] text-lg font-bold">Your Tasks</CardTitle>
              <CardDescription className="text-gray-500">
                Tasks filtered by: {filter === 'all' ? 'All' : filter === 'completed' ? 'Completed' : 'Pending'}
                {selectedGoalId !== null && ` • Goal: ${selectedGoalId === 0 ? 'None' : goals.find(g => g.id === selectedGoalId)?.name || 'Selected'}`}
                {dateFilterActive && ` • Date: ${format(dateRange.from!, 'MMM d')}${dateRange.to ? ` - ${format(dateRange.to, 'MMM d')}` : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <TaskList 
                tasks={tasks}
                isLoading={isTasksLoading}
                filter={filter}
                userId={user.id}
                selectedGoalId={selectedGoalId}
                sortBy={sortBy}
                sortDirection={sortDirection}
                isDateFilterActive={dateFilterActive}
                isDateInRange={dateFilterActive ? isDateInRange : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to track your progress
              </DialogDescription>
            </DialogHeader>
            
            <TaskForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/tasks', user?.id] });
              }}
              userId={user?.id || 0}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}