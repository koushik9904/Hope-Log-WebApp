import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  JournalEntry, 
  Mood, 
  Summary 
} from "@shared/schema";
import { 
  Calendar,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  Correlations 
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
  
  const isLoading = entriesLoading || moodsLoading || summaryLoading;
  
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
              onValueChange={setTimeframe}
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
            
            <Button variant="outline" className="gap-2 bg-white">
              <Calendar className="h-4 w-4" />
              Custom Range
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="moods">Mood Tracker</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReflectionPatterns entries={entries} isLoading={isLoading} />
              <Correlations entries={entries} moods={moods} isLoading={isLoading} />
            </div>
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