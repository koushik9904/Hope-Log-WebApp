import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Goal } from '@shared/schema';
import TaskList from '@/components/goals/task-list';
import TaskForm from '@/components/goals/task-form';
import PageHeader from '@/components/ui/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TasksPage() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container p-4 mx-auto">
      <PageHeader
        title="Tasks"
        description="Manage your tasks and track your daily progress"
        className="mb-8"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter by Goal
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Select a Goal</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedGoalId(null)}>
                All Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedGoalId(undefined)}>
                Tasks without goal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {goals.map((goal) => (
                <DropdownMenuItem key={goal.id} onClick={() => setSelectedGoalId(goal.id)}>
                  {goal.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {selectedGoalId === null
            ? 'All Tasks'
            : selectedGoalId === undefined
            ? 'Tasks without Goal'
            : `Tasks for: ${goals.find((g) => g.id === selectedGoalId)?.title || 'Selected Goal'}`}
        </h2>
        <TaskList userId={user.id} selectedGoalId={selectedGoalId} />
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm userId={user.id} onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}