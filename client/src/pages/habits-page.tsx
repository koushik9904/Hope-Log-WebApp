import { useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import HabitList from '@/components/goals/habit-list';
import HabitForm from '@/components/goals/habit-form';
import AISuggestions from '@/components/goals/ai-suggestions';
import HabitAISuggestions from '@/components/goals/habit-ai-suggestions';
import PageHeader from '@/components/ui/page-header';

// Interface matching the AISuggestions component's expected format
interface HabitForAI {
  id: number;
  title: string;
  description: string | null;
}

// Helper component to fetch habit titles and pass them to children
function FetchHabitTitles({ 
  userId, 
  children 
}: { 
  userId: number, 
  children: (habits: HabitForAI[]) => ReactNode 
}) {
  const { data: habits = [], isLoading } = useQuery<HabitForAI[]>({
    queryKey: [`/api/habits/${userId}`],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#9AAB63]" />
      </div>
    );
  }
  
  return <>{children(habits)}</>;
}

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

      {/* Main content area with AI suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* AI Suggestions Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="border-b border-gray-100 pb-3">
              <CardTitle className="text-lg font-bold">AI Suggestions</CardTitle>
              <CardDescription>
                Habits based on your journal
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Use the specialized HabitAISuggestions component with both buttons */}
              <FetchHabitTitles userId={user.id}>
                {(habits) => {
                  // Only pass the titles for more efficient filtering
                  return (
                    <HabitAISuggestions 
                      existingHabitTitles={habits.map(habit => habit.title)}
                    />
                  );
                }}
              </FetchHabitTitles>
            </CardContent>
          </Card>
        </div>
        
        {/* Habits Section */}
        <Card className="md:col-span-3 bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable'] text-lg font-bold">Your Habits</CardTitle>
            <CardDescription className="text-gray-500">
              {filter === 'all' ? 'All Habits' : 
                filter === 'active' ? 'Active Habits' : 'Completed Today'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <HabitList userId={user.id} filter={filter} />
          </CardContent>
        </Card>
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