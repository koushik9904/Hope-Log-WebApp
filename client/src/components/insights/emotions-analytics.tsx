import { useState, useMemo } from "react";
import { JournalEntry, Mood } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Cloud,
  Calendar,
  BarChart3,
  Activity,
  Award,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isWithinInterval, subMonths } from "date-fns";

interface EmotionsAnalyticsProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  className?: string;
}

export function EmotionsAnalytics({ entries, isLoading, className }: EmotionsAnalyticsProps) {
  const [timespan, setTimespan] = useState<"month" | "all">("month");
  
  const filteredEntries = useMemo(() => {
    if (timespan === "all") return entries;
    
    const now = new Date();
    const monthAgo = subMonths(now, 1);
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return isWithinInterval(entryDate, { start: monthAgo, end: now });
    });
  }, [entries, timespan]);
  
  // Extract all emotions from entries
  const emotionsData = useMemo(() => {
    // Create a map for counting emotions
    const emotions: Record<string, { count: number, entry: JournalEntry }[]> = {};
    
    filteredEntries.forEach(entry => {
      if (entry.sentiment?.emotions) {
        entry.sentiment.emotions.forEach(emotion => {
          if (!emotions[emotion]) {
            emotions[emotion] = [];
          }
          emotions[emotion].push({ count: 1, entry });
        });
      }
    });
    
    // Convert to array and sort by frequency
    return Object.entries(emotions)
      .map(([emotion, instances]) => ({
        emotion,
        count: instances.length,
        entries: instances.map(i => i.entry)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEntries]);
  
  // Find patterns in emotions
  const emotionPatterns = useMemo(() => {
    const patterns = [];
    
    if (emotionsData.length === 0) return [];
    
    // Most frequent emotion
    if (emotionsData[0]) {
      patterns.push({
        title: "Most Common Emotion",
        description: `${emotionsData[0].emotion} appears in ${emotionsData[0].count} entries`,
        icon: <Award className="h-5 w-5 text-[#F5D867]" />,
        color: "border-[#F5D867]"
      });
    }
    
    // Look for positive emotions
    const positiveEmotions = ["Happy", "Joyful", "Grateful", "Excited", "Proud", "Calm", "Peaceful", "Content", "Inspired", "Hopeful"];
    const positiveCounts = emotionsData
      .filter(e => positiveEmotions.includes(e.emotion))
      .reduce((acc, e) => acc + e.count, 0);
    
    const negativeEmotions = ["Sad", "Anxious", "Angry", "Frustrated", "Stressed", "Overwhelmed", "Disappointed", "Tired", "Lonely", "Worried"];
    const negativeCounts = emotionsData
      .filter(e => negativeEmotions.includes(e.emotion))
      .reduce((acc, e) => acc + e.count, 0);
    
    if (positiveCounts > 0 || negativeCounts > 0) {
      const total = positiveCounts + negativeCounts;
      if (total > 0) {
        const positiveRatio = positiveCounts / total;
        
        if (positiveRatio > 0.7) {
          patterns.push({
            title: "Positive Outlook",
            description: `${Math.round(positiveRatio * 100)}% of your emotional mentions are positive`,
            icon: <Heart className="h-5 w-5 text-[#F5B8DB]" />,
            color: "border-[#F5B8DB]"
          });
        } else if (positiveRatio < 0.3) {
          patterns.push({
            title: "Challenging Times",
            description: `${Math.round((1 - positiveRatio) * 100)}% of your emotional mentions are challenging`,
            icon: <Activity className="h-5 w-5 text-[#B6CAEB]" />,
            color: "border-[#B6CAEB]"
          });
        } else {
          patterns.push({
            title: "Balanced Emotions",
            description: `You've expressed a balanced mix of positive and challenging emotions`,
            icon: <Activity className="h-5 w-5 text-[#9AAB63]" />,
            color: "border-[#9AAB63]"
          });
        }
      }
    }
    
    // Check for emotion variety
    if (emotionsData.length >= 5) {
      patterns.push({
        title: "Emotional Awareness",
        description: `You've identified ${emotionsData.length} different emotions in your entries`,
        icon: <Zap className="h-5 w-5 text-[#B6CAEB]" />,
        color: "border-[#B6CAEB]"
      });
    }
    
    return patterns;
  }, [emotionsData]);
  
  const getEmotionCloudSize = (count: number, maxCount: number) => {
    const sizes = [
      "text-sm", 
      "text-base", 
      "text-lg", 
      "text-xl", 
      "text-2xl"
    ];
    
    const maxSize = sizes.length - 1;
    const size = Math.ceil((count / maxCount) * maxSize);
    return sizes[Math.min(size, maxSize)];
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold font-['Montserrat_Variable']">Emotions Analysis</h3>
        
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm font-medium rounded-l-lg ${
              timespan === "month" 
                ? "bg-[#9AAB63] text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setTimespan("month")}
          >
            Past Month
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm font-medium rounded-r-lg ${
              timespan === "all" 
                ? "bg-[#9AAB63] text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setTimespan("all")}
          >
            All Time
          </button>
        </div>
      </div>
      
      <Tabs defaultValue="trends">
        <div className="mb-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="trends" className="text-sm">Trends</TabsTrigger>
            <TabsTrigger value="cloud" className="text-sm">Word Cloud</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-sm md:col-span-2">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="font-['Montserrat_Variable']">Emotion Patterns</CardTitle>
                <CardDescription>
                  Patterns and trends in your emotional expressions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {emotionPatterns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {emotionPatterns.map((pattern, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${pattern.color}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {pattern.icon}
                          <h4 className="font-medium">{pattern.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{pattern.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Heart className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No emotion data yet</h3>
                    <p className="text-gray-500 max-w-md">
                      Continue journaling to build up emotion data that can reveal patterns and insights.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="font-['Montserrat_Variable']">Top Emotions</CardTitle>
                <CardDescription>
                  Your most frequently mentioned emotions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {emotionsData.length > 0 ? (
                  <div className="space-y-4">
                    {emotionsData.slice(0, 6).map((emotion, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-[#FFF8E8]">{emotion.count}</Badge>
                          <span className="font-medium">{emotion.emotion}</span>
                        </div>
                        <div className="w-1/2 bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-[#F5B8DB] to-[#9AAB63] h-2.5 rounded-full" 
                            style={{ width: `${(emotion.count / (emotionsData[0]?.count || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart3 className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500">No emotions data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="font-['Montserrat_Variable']">Recent Emotions</CardTitle>
                <CardDescription>
                  Emotions from your most recent journal entries
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredEntries.length > 0 ? (
                  <div className="space-y-4">
                    {filteredEntries
                      .filter(entry => entry.sentiment?.emotions && entry.sentiment.emotions.length > 0)
                      .slice(0, 4)
                      .map((entry, index) => (
                        <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                          <div className="text-xs text-gray-500 mb-1">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {entry.sentiment?.emotions.map((emotion, eidx) => (
                              <Badge key={eidx} variant="secondary" className="bg-[#FFF8E8] text-[#9AAB63]">
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500">No recent entries with emotions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cloud">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="font-['Montserrat_Variable']">Emotion Word Cloud</CardTitle>
              <CardDescription>
                Visual representation of your emotional expressions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {emotionsData.length > 0 ? (
                <div className="min-h-[300px] flex items-center justify-center bg-[#FFF8E8] rounded-lg p-6">
                  <div className="flex flex-wrap justify-center items-center gap-3 max-w-lg text-center">
                    {emotionsData.map((emotion, index) => {
                      const maxCount = emotionsData[0]?.count || 1;
                      const sizeClass = getEmotionCloudSize(emotion.count, maxCount);
                      
                      // Generate a color based on the emotion
                      let colorClass = "";
                      if (["Happy", "Joyful", "Excited", "Grateful", "Proud", "Inspired"].includes(emotion.emotion)) {
                        colorClass = "text-[#9AAB63]"; // Green for positive
                      } else if (["Sad", "Angry", "Frustrated", "Disappointed", "Stressed", "Anxious"].includes(emotion.emotion)) {
                        colorClass = "text-[#F5B8DB]"; // Pink for negative
                      } else if (["Calm", "Peaceful", "Content", "Hopeful", "Curious", "Thoughtful"].includes(emotion.emotion)) {
                        colorClass = "text-[#B6CAEB]"; // Blue for calm
                      } else {
                        colorClass = "text-[#F5D867]"; // Yellow for neutral
                      }
                      
                      return (
                        <div 
                          key={index} 
                          className={`${sizeClass} ${colorClass} font-semibold`}
                          style={{ transform: `rotate(${Math.random() * 20 - 10}deg)` }}
                        >
                          {emotion.emotion}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Cloud className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No emotion data yet</h3>
                  <p className="text-gray-500 max-w-md">
                    Continue journaling to build up emotion data for your word cloud.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}