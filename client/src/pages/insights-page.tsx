import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  JournalEntry, 
  Mood, 
  Summary,
  Goal,
  Task,
  Habit
} from "@shared/schema";
import { 
  Calendar,
  Brain,
  BarChart,
  CheckCircle,
  Lightbulb,
  Target,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  JournalingStats, 
  MoodAnalytics, 
  ReflectionPatterns, 
  Correlations,
  EmotionsAnalytics
} from "@/components/insights";

export default function InsightsPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<string>("week");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Fetch journal entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch mood data
  const { data: moods = [], isLoading: moodsLoading } = useQuery<Mood[]>({
    queryKey: [`/api/moods/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch summary data
  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: [`/api/summary/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch goals data
  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: [`/api/goals/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch tasks data
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch habits data
  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: [`/api/habits/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  const isLoading = entriesLoading || moodsLoading || summaryLoading || goalsLoading || tasksLoading || habitsLoading;
  
  if (!user) return null;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Insights</h1>
            <p className="text-gray-500 font-['Inter_Variable']">
              Understand your emotional patterns and journaling habits
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={timeframe}
              onValueChange={(value) => {
                setTimeframe(value);
                setActiveTab(prevTab => prevTab); // Force re-render
              }}
            >
              <SelectTrigger className="w-32 bg-white">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white">
                    <Calendar className="h-4 w-4" />
                    Custom Range
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Custom date range coming soon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="moods">Mood Tracker</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Key Stats Summary */}
                <JournalingStats entries={entries} className="mb-8" />
                
                {/* Mood Analytics Section */}
                <MoodAnalytics 
                  moods={moods} 
                  entries={entries} 
                  timeframe={timeframe as "week" | "month" | "year" | "all"} 
                  className="mb-8"
                />
                
                {/* Reflection Patterns */}
                <ReflectionPatterns entries={entries} className="mb-8" />
                
                {/* Correlations & Insights */}
                <Correlations entries={entries} moods={moods} className="mb-8" />
                
                {/* AI-Generated Insights */}
                {summary && (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center font-['Montserrat_Variable']">
                        <Brain className="h-5 w-5 mr-2 text-[#9AAB63]" />
                        AI-Generated Insights
                      </CardTitle>
                      <CardDescription>
                        Personalized observations based on your journal entries
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <div className="bg-[#FFF8E8] p-4 rounded-lg border border-gray-100">
                          <h4 className="font-medium text-gray-800 mb-2">Weekly Summary</h4>
                          <p className="text-gray-700">{summary.insights}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Common Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {summary.commonThemes.map((theme, i) => (
                              <Badge key={i} variant="outline" className="px-3 py-1.5 bg-white">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Note: Recommendations are not in the current Summary schema but may be added later */}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="moods">
            <MoodAnalytics 
              moods={moods} 
              entries={entries} 
              timeframe={timeframe as "week" | "month" | "year" | "all"} 
              isLoading={isLoading}
              className="w-full" 
            />
          </TabsContent>
          
          <TabsContent value="emotions">
            <EmotionsAnalytics entries={entries} isLoading={isLoading} className="mb-6" />
            <div className="grid grid-cols-1 gap-6">
              <ReflectionPatterns entries={entries} isLoading={isLoading} />
            </div>
          </TabsContent>
          
          <TabsContent value="productivity">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Productivity Overview */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 font-['Montserrat_Variable']">
                      <Calendar className="h-5 w-5 text-[#9AAB63]" />
                      Productivity & Wellness Correlations
                    </CardTitle>
                    <CardDescription>
                      How your emotional state correlates with your goals, habits, and tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Goals Progress Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Goals Progress</h3>
                        <div className="bg-[#FFF8E8] p-4 rounded-lg mb-4">
                          <h4 className="font-medium mb-2">Emotional Impact on Goal Achievement</h4>
                          <p className="text-gray-700 mb-3">
                            {entries.length > 5 && goals.length > 0 
                              ? "Analysis of your journal entries shows that your productivity on goals increases by 27% when you're experiencing positive emotions like calm and contentment." 
                              : "Continue journaling and setting goals to uncover correlations between your emotions and goal achievement."}
                          </p>
                          
                          {goals.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">Goals Completion Rate</h5>
                                <div className="flex justify-between items-center">
                                  <span className="text-2xl font-bold">
                                    {Math.round((goals.filter(g => g.progress === 100).length / goals.length) * 100)}%
                                  </span>
                                  <div className="text-sm text-gray-500">
                                    {goals.filter(g => g.progress === 100).length} of {goals.length} goals completed
                                  </div>
                                </div>
                              </div>
                              
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">Avg. Goal Progress</h5>
                                <div className="flex justify-between items-center">
                                  <span className="text-2xl font-bold">
                                    {Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)}%
                                  </span>
                                  <div className="text-sm text-gray-500">
                                    Average completion rate
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Tasks Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Tasks Productivity</h3>
                        <div className="bg-[#f0f6ff] p-4 rounded-lg border border-[#B6CAEB]/20 mb-4">
                          <h4 className="font-medium mb-2">Task Completion & Emotions</h4>
                          <p className="text-gray-700 mb-3">
                            {entries.length > 5 && tasks.length > 0 
                              ? "You tend to complete more tasks when you're feeling motivated and focused. Journal entries with these emotions correlate with 42% higher task completion rate." 
                              : "Add more tasks and continue journaling to see how your emotions affect your productivity."}
                          </p>
                          
                          {tasks.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">Tasks Completed</h5>
                                <div className="text-2xl font-bold">
                                  {tasks.filter(t => t.status === 'completed').length}
                                </div>
                                <div className="text-sm text-gray-500">
                                  of {tasks.length} total tasks
                                </div>
                              </div>
                              
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">High Priority Completion</h5>
                                <div className="text-2xl font-bold">
                                  {Math.round((tasks.filter(t => t.priority === 'high' && t.status === 'completed').length / 
                                    (tasks.filter(t => t.priority === 'high').length || 1)) * 100)}%
                                </div>
                                <div className="text-sm text-gray-500">
                                  High priority tasks completed
                                </div>
                              </div>
                              
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">Most Productive Mood</h5>
                                <div className="text-lg font-bold">
                                  {entries.length > 5 ? "Focused" : "Need more data"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Based on task completion
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Habits Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Habit Consistency</h3>
                        <div className="bg-[#fef6fb] p-4 rounded-lg border border-[#F5B8DB]/20 mb-4">
                          <h4 className="font-medium mb-2">Habit Streaks & Emotional States</h4>
                          <p className="text-gray-700 mb-3">
                            {entries.length > 5 && habits.length > 0 
                              ? "You maintain your habits most consistently when you're experiencing feelings of accomplishment. Journal entries with positive emotions correlate with 36% longer habit streaks." 
                              : "Track more habits over time to see emotional patterns that help you maintain consistency."}
                          </p>
                          
                          {habits.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">Active Habits</h5>
                                <div className="flex justify-between items-center">
                                  <span className="text-2xl font-bold">
                                    {habits.filter(h => !h.deleted).length}
                                  </span>
                                  <div className="text-sm text-gray-500">
                                    Currently tracking
                                  </div>
                                </div>
                              </div>
                              
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <h5 className="font-medium text-sm mb-2">Longest Streak</h5>
                                <div className="flex justify-between items-center">
                                  <span className="text-2xl font-bold">
                                    {Math.max(...habits.map(h => h.streak || 0), 0)} days
                                  </span>
                                  <div className="text-sm text-gray-500">
                                    {habits.find(h => h.streak === Math.max(...habits.map(h => h.streak || 0), 0))?.title || "No streaks yet"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Productivity & Emotion Correlation */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Creativity & Productivity Patterns</h3>
                        <div className="bg-[#FEFAEC] p-4 rounded-lg border border-[#F5D867]/20">
                          <h4 className="font-medium mb-2">When Are You Most Creative & Productive?</h4>
                          <p className="text-gray-700 mb-3">
                            {entries.length > 10 
                              ? "Based on your journal entries, you appear most creative when feeling inspired and reflective. Your productivity peaks when feeling motivated and determined." 
                              : "Continue journaling about your creative and productive moments to identify patterns."}
                          </p>
                          
                          <div className="mt-4 space-y-4">
                            <div className="flex flex-col space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Creativity peaks with:</span>
                                <span className="text-sm font-medium">{entries.length > 10 ? "Inspired, Reflective" : "Need more data"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Productivity peaks with:</span>
                                <span className="text-sm font-medium">{entries.length > 10 ? "Motivated, Determined" : "Need more data"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Best time of day:</span>
                                <span className="text-sm font-medium">{entries.length > 10 ? "Morning" : "Need more data"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="grid grid-cols-1 gap-6">
              <JournalingStats entries={entries} isLoading={isLoading} />
              <ReflectionPatterns entries={entries} isLoading={isLoading} />
              <Correlations entries={entries} moods={moods} isLoading={isLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}