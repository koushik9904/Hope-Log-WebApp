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
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Insights</h1>
          <p className="text-gray-500">
            Understand your emotional patterns and journaling habits
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
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
              <div className="pi-thinking-dots">
                <div className="pi-thinking-dot"></div>
                <div className="pi-thinking-dot"></div>
                <div className="pi-thinking-dot"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                    <BarChart2 className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEntries}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {userEntries} written by you
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Mood</CardTitle>
                    <Smile className="h-4 w-4 text-gray-500" />
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
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <Award className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentStreak} days</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hasEntryToday ? "You've journaled today!" : "No entry today yet"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Word Count</CardTitle>
                    <ListChecks className="h-4 w-4 text-gray-500" />
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
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Mood Over Time</CardTitle>
                    <CardDescription>
                      Your emotional journey for the {timeframe === 'week' ? 'past week' : timeframe === 'month' ? 'past month' : 'past year'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Emotions</CardTitle>
                    <CardDescription>
                      Most frequent emotions in your journal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-blue-600" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>
                    Personalized observations based on your journal entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-800 mb-2">Weekly Summary</h4>
                        <p className="text-gray-700">{summary.insights}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Common Themes</h4>
                        <div className="flex flex-wrap gap-2">
                          {summary.commonThemes.map((theme, i) => (
                            <Badge key={i} variant="outline" className="px-3 py-1.5">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                              <span className="text-xs font-bold text-blue-600">1</span>
                            </div>
                            <span>Try journaling about your achievements more often</span>
                          </li>
                          <li className="flex items-start">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                              <span className="text-xs font-bold text-blue-600">2</span>
                            </div>
                            <span>Consider practicing mindfulness when feeling anxious</span>
                          </li>
                          <li className="flex items-start">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                              <span className="text-xs font-bold text-blue-600">3</span>
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
          <Card>
            <CardHeader>
              <CardTitle>Mood Tracker</CardTitle>
              <CardDescription>
                Track and visualize your emotional state over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodChartData.length > 0 ? (
                <div className="space-y-8">
                  <MoodChart data={moodChartData} height={300} />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Mood Log</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {moods.map((mood) => (
                            <tr key={mood.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(mood.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getMoodLabel(mood.rating)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={
                                  mood.rating >= 4 ? "success" : 
                                  mood.rating <= 2 ? "destructive" : 
                                  "secondary"
                                }>
                                  {mood.rating}/5
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Smile className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No mood data yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start tracking your mood daily to see patterns over time
                  </p>
                  <Button className="pi-button">Record Your First Mood</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="emotions">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Analysis</CardTitle>
              <CardDescription>
                Insights into the emotions expressed in your journal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emotions.size > 0 ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Emotions Cloud</h3>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <div className="flex flex-wrap gap-3">
                        {Array.from(emotions).map((emotion, i) => {
                          const count = emotionCounts[emotion] || 1;
                          const size = Math.max(0.8, Math.min(2, count / 5 + 0.8));
                          return (
                            <span 
                              key={i} 
                              className="px-3 py-1.5 bg-white rounded-full border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                              style={{ 
                                fontSize: `${size}rem`,
                                opacity: 0.5 + (count / 10) * 0.5
                              }}
                            >
                              {emotion}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Positive Emotions</h3>
                      <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                        <div className="flex flex-wrap gap-2">
                          {Array.from(emotions)
                            .filter(e => ["Happy", "Joy", "Excited", "Grateful", "Content", "Calm", "Hopeful", "Inspired", "Proud", "Love"].includes(e))
                            .map((emotion, i) => (
                              <Badge key={i} className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                {emotion} ({emotionCounts[emotion]})
                              </Badge>
                            ))}
                          {Array.from(emotions)
                            .filter(e => ["Happy", "Joy", "Excited", "Grateful", "Content", "Calm", "Hopeful", "Inspired", "Proud", "Love"].includes(e))
                            .length === 0 && (
                              <p className="text-gray-500 text-sm">No positive emotions detected yet.</p>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Challenging Emotions</h3>
                      <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                        <div className="flex flex-wrap gap-2">
                          {Array.from(emotions)
                            .filter(e => ["Sad", "Anxious", "Stressed", "Overwhelmed", "Angry", "Frustrated", "Worried", "Tired", "Confused", "Disappointed"].includes(e))
                            .map((emotion, i) => (
                              <Badge key={i} className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                                {emotion} ({emotionCounts[emotion]})
                              </Badge>
                            ))}
                          {Array.from(emotions)
                            .filter(e => ["Sad", "Anxious", "Stressed", "Overwhelmed", "Angry", "Frustrated", "Worried", "Tired", "Confused", "Disappointed"].includes(e))
                            .length === 0 && (
                              <p className="text-gray-500 text-sm">No challenging emotions detected yet.</p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Heart className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No emotion data yet</h3>
                  <p className="text-gray-500 mb-4">
                    Continue journaling to see emotion analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Journaling Activity</CardTitle>
              <CardDescription>
                Track your journaling habits and consistency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Activity Overview</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Journal Entries</h4>
                        <Badge variant="outline">{totalEntries} total</Badge>
                      </div>
                      <div className="text-3xl font-bold">{userEntries}</div>
                      <p className="text-sm text-gray-500">entries written by you</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Words Written</h4>
                        <Badge variant="outline">{avgWordsPerEntry} avg</Badge>
                      </div>
                      <div className="text-3xl font-bold">{totalWords}</div>
                      <p className="text-sm text-gray-500">total words in your journal</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Current Streak</h4>
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-3xl font-bold">{currentStreak} days</div>
                      <p className="text-sm text-gray-500">
                        {hasEntryToday ? "You've journaled today" : "Start journaling today"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Activity Calendar</h3>
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium mb-2">Activity Calendar Coming Soon</h4>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        We're working on a beautiful calendar view to help you visualize your journaling habits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-8" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                {entries.length > 0 ? (
                  <div className="space-y-4">
                    {entries
                      .filter(e => !e.isAiResponse)
                      .slice(0, 5)
                      .map((entry) => (
                        <div key={entry.id} className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="mr-4">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-gray-800">Journal Entry</h4>
                              <div className="text-xs text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm line-clamp-2 mb-2">{entry.content}</p>
                            <div className="flex items-center">
                              <Button variant="link" className="h-8 px-0 text-blue-600">
                                View Entry <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No journal entries yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}