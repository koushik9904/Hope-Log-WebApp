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
  BarChart2, 
  Smile, 
  Award, 
  Heart, 
  TrendingUp, 
  ListChecks,
  Clock,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Brain
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { MoodChart, MoodData } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

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
  
  // Calculate insights
  const totalEntries = entries.length;
  const userEntries = entries.filter(e => !e.isAiResponse).length;
  const totalWords = entries
    .filter(e => !e.isAiResponse)
    .reduce((acc, entry) => acc + entry.content.split(/\s+/).length, 0);
  
  // Get average words per entry
  const avgWordsPerEntry = userEntries > 0 
    ? Math.round(totalWords / userEntries) 
    : 0;
  
  // Convert mood data for chart
  const moodChartData: MoodData[] = moods.map(mood => ({
    date: new Date(mood.date).toLocaleDateString(),
    mood: mood.rating,
    label: getMoodLabel(mood.rating)
  }));
  
  // Function to get mood label
  function getMoodLabel(rating: number): string {
    switch(rating) {
      case 1: return "Very Sad";
      case 2: return "Sad";
      case 3: return "Neutral";
      case 4: return "Happy";
      case 5: return "Very Happy";
      default: return "Unknown";
    }
  }

  // Calculate streak information
  const hasEntryToday = entries.some(entry => {
    const today = new Date().toLocaleDateString();
    const entryDate = new Date(entry.date).toLocaleDateString();
    return entryDate === today && !entry.isAiResponse;
  });
  
  // Get current streak (this would be more complex in a real implementation)
  const currentStreak = hasEntryToday ? 1 : 0;
  
  // Get all emotions from entries
  const emotions = new Set<string>();
  entries.forEach(entry => {
    if (entry.sentiment?.emotions) {
      entry.sentiment.emotions.forEach(emotion => emotions.add(emotion));
    }
  });
  
  // Count emotion occurrences
  const emotionCounts: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.sentiment?.emotions) {
      entry.sentiment.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    }
  });
  
  // Get top emotions
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
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
          <TabsList className="mb-6 bg-black">
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                      <BarChart2 className="h-4 w-4 text-[#9AAB63]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalEntries}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {userEntries} written by you
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Mood</CardTitle>
                      <Smile className="h-4 w-4 text-[#F5D867]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {moods.length > 0 
                          ? (moods.reduce((acc, mood) => acc + mood.rating, 0) / moods.length).toFixed(1)
                          : "N/A"}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on {moods.length} mood records
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                      <Award className="h-4 w-4 text-[#B6CAEB]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentStreak} days</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {hasEntryToday ? "You've journaled today!" : "No entry today yet"}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Word Count</CardTitle>
                      <ListChecks className="h-4 w-4 text-[#F5B8DB]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalWords}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {avgWordsPerEntry} words per entry avg.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="font-['Montserrat_Variable']">Mood Over Time</CardTitle>
                      <CardDescription>
                        Your emotional journey for the {timeframe === 'week' ? 'past week' : timeframe === 'month' ? 'past month' : 'past year'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {moodChartData.length > 0 ? (
                        <MoodChart data={moodChartData} height={250} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <Smile className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No mood data yet</h3>
                          <p className="text-gray-500 mb-4">
                            Track your mood daily to see trends over time
                          </p>
                          <Button variant="outline">Record Today's Mood</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="font-['Montserrat_Variable']">Top Emotions</CardTitle>
                      <CardDescription>
                        Most frequent emotions in your journal
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {topEmotions.length > 0 ? (
                        <div className="space-y-4">
                          {topEmotions.map(([emotion, count], index) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="w-6 text-gray-500">{index + 1}.</span>
                                <span className="font-medium">{emotion}</span>
                              </div>
                              <Badge variant="secondary">{count} times</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <Heart className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-gray-500">
                            No emotions detected yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
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
                    {summary ? (
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
                        
                        <div>
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <div className="w-5 h-5 rounded-full bg-[#FFF8E8] flex items-center justify-center mr-2 mt-0.5">
                                <span className="text-xs font-bold text-[#9AAB63]">1</span>
                              </div>
                              <span>Try journaling about your achievements more often</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-5 h-5 rounded-full bg-[#FFF8E8] flex items-center justify-center mr-2 mt-0.5">
                                <span className="text-xs font-bold text-[#9AAB63]">2</span>
                              </div>
                              <span>Consider practicing mindfulness when feeling anxious</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-5 h-5 rounded-full bg-[#FFF8E8] flex items-center justify-center mr-2 mt-0.5">
                                <span className="text-xs font-bold text-[#9AAB63]">3</span>
                              </div>
                              <span>Reflect more on positive interactions with others</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-12">
                        <Brain className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Insights coming soon</h3>
                        <p className="text-gray-500 mb-4 max-w-md">
                          Continue journaling to receive personalized insights about your emotional patterns and trends.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="moods">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="font-['Montserrat_Variable']">Mood Tracker</CardTitle>
                <CardDescription>
                  Track and visualize your emotional state over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {moodChartData.length > 0 ? (
                  <div className="space-y-8">
                    <MoodChart data={moodChartData} height={300} />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4 font-['Montserrat_Variable']">Mood Log</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-[#FFF8E8]">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Mood</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {moods.map((mood) => (
                              <tr key={mood.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(mood.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    className={`px-2 py-1 ${
                                      mood.rating === 5 ? 'bg-green-100 text-green-800' : 
                                      mood.rating === 4 ? 'bg-blue-100 text-blue-800' : 
                                      mood.rating === 3 ? 'bg-yellow-100 text-yellow-800' : 
                                      mood.rating === 2 ? 'bg-orange-100 text-orange-800' : 
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {getMoodLabel(mood.rating)}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {mood.notes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Smile className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No mood data yet</h3>
                    <p className="text-gray-500 mb-4">
                      Start tracking your mood to see your emotional patterns over time
                    </p>
                    <Button className="bg-[#F5B8DB] hover:bg-[#f096c9]">Record Your Mood</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="emotions">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="font-['Montserrat_Variable']">Emotion Analysis</CardTitle>
                <CardDescription>
                  Insights about your emotional patterns from journal entries
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium font-['Montserrat_Variable']">Top Emotions</h3>
                    {topEmotions.length > 0 ? (
                      <div className="space-y-3">
                        {topEmotions.map(([emotion, count], index) => (
                          <div key={emotion} className="flex items-center">
                            <div className="w-full bg-gray-100 rounded-full h-4 mr-2">
                              <div 
                                className="bg-[#F5B8DB] h-4 rounded-full" 
                                style={{ width: `${(count / totalEntries) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center w-32">
                              <span className="text-sm font-medium">{emotion}</span>
                              <span className="text-xs text-gray-600">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 bg-[#FFF8E8] rounded-lg">
                        <Heart className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">
                          No emotions detected yet
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium font-['Montserrat_Variable']">Recent Emotions</h3>
                    {entries.length > 0 ? (
                      <div className="space-y-4">
                        {entries.slice(0, 5).map(entry => (
                          <div key={entry.id} className="p-4 bg-[#FFF8E8] rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm text-gray-600">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">{entry.content}</p>
                            {entry.sentiment?.emotions && (
                              <div className="flex flex-wrap gap-1">
                                {entry.sentiment.emotions.map(emotion => (
                                  <Badge key={emotion} variant="outline" className="bg-white text-xs">
                                    {emotion}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 bg-[#FFF8E8] rounded-lg">
                        <Clock className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">
                          No journal entries found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="font-['Montserrat_Variable']">Journal Activity</CardTitle>
                <CardDescription>
                  Track your journaling consistency over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {entries.length > 0 ? (
                  <div className="space-y-8">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-1 divide-y divide-gray-100">
                        {entries.slice(0, 10).map(entry => (
                          <div key={entry.id} className="p-4">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-gray-800">Journal Entry</h4>
                              <div className="text-xs text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm line-clamp-2 mb-2">{entry.content}</p>
                            <div className="flex items-center">
                              <Button variant="link" className="h-8 px-0 text-[#9AAB63]">
                                View Entry <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#FFF8E8] rounded-lg">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      Start journaling to track your thoughts, emotions, and personal growth over time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}