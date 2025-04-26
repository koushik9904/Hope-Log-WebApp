import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HabitList from '@/components/goals/habit-list';
import HabitForm from '@/components/goals/habit-form';
import PageHeader from '@/components/ui/page-header';

export default function HabitsPage() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container p-4 mx-auto">
      <PageHeader
        title="Habits"
        description="Build consistent routines and track your progress"
        className="mb-8"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="h-9">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed Today</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Habit
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {filter === 'all' ? 'All Habits' : 
            filter === 'active' ? 'Active Habits' : 'Completed Today'}
        </h2>
        <HabitList userId={user.id} />
      </div>

      {/* Create Habit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Habit</DialogTitle>
          </DialogHeader>
          <HabitForm userId={user.id} onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}