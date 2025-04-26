import { JournalEntry } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Brain,
  Lightbulb,
  Sparkles,
  Calendar,
  Clock,
  HeartHandshake,
  Glasses,
  Star,
  BookOpen
} from "lucide-react";
import { format, getDay, getHours, parseISO } from "date-fns";

interface ReflectionPatternsProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  className?: string;
}

export function ReflectionPatterns({ entries, isLoading, className }: ReflectionPatternsProps) {
  // Filter to user-created entries only
  const userEntries = entries.filter(e => !e.isAiResponse);
  
  // Function to generate reflection insights
  const generateInsights = () => {
    if (userEntries.length < 3) return [];
    
    const insights: { icon: JSX.Element; text: string; color: string }[] = [];
    
    // Get day of week distribution
    const dayDistribution: Record<number, number> = {};
    userEntries.forEach(entry => {
      const day = getDay(new Date(entry.date));
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });
    
    const totalEntries = userEntries.length;
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mostFrequentDay = Object.entries(dayDistribution)
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    
    if (mostFrequentDay) {
      const dayName = dayNames[Number(mostFrequentDay[0])];
      const percentage = Math.round((Number(mostFrequentDay[1]) / totalEntries) * 100);
      if (percentage >= 25) {
        insights.push({
          icon: <Calendar className="h-5 w-5" />,
          text: `You write most often on ${dayName}s (${percentage}% of entries).`,
          color: "text-[#9AAB63]"
        });
      }
    }
    
    // Time of day analysis
    const hourDistribution: Record<string, number> = {
      morning: 0,   // 5-11
      afternoon: 0, // 12-16
      evening: 0,   // 17-20
      night: 0      // 21-4
    };
    
    const hourToWords: Record<string, { entries: JournalEntry[], wordCount: number }> = {
      morning: { entries: [], wordCount: 0 },
      afternoon: { entries: [], wordCount: 0 },
      evening: { entries: [], wordCount: 0 },
      night: { entries: [], wordCount: 0 }
    };
    
    userEntries.forEach(entry => {
      const hour = getHours(new Date(entry.date));
      const words = entry.content.split(/\s+/).length;
      
      if (hour >= 5 && hour < 12) {
        hourDistribution.morning++;
        hourToWords.morning.entries.push(entry);
        hourToWords.morning.wordCount += words;
      } else if (hour >= 12 && hour < 17) {
        hourDistribution.afternoon++;
        hourToWords.afternoon.entries.push(entry);
        hourToWords.afternoon.wordCount += words;
      } else if (hour >= 17 && hour < 21) {
        hourDistribution.evening++;
        hourToWords.evening.entries.push(entry);
        hourToWords.evening.wordCount += words;
      } else {
        hourDistribution.night++;
        hourToWords.night.entries.push(entry);
        hourToWords.night.wordCount += words;
      }
    });
    
    // Calculate average words per time of day
    Object.keys(hourToWords).forEach(time => {
      const { entries, wordCount } = hourToWords[time];
      if (entries.length > 0) {
        hourToWords[time].wordCount = Math.round(wordCount / entries.length);
      }
    });
    
    // Find time with highest average word count
    const timeWithMostWords = Object.entries(hourToWords)
      .filter(([_, data]) => data.entries.length >= 2)
      .sort((a, b) => b[1].wordCount - a[1].wordCount)[0];
    
    if (timeWithMostWords) {
      const [time, data] = timeWithMostWords;
      const timeLabel = time.charAt(0).toUpperCase() + time.slice(1);
      const baseAvg = Math.round(userEntries.reduce((acc, e) => acc + e.content.split(/\s+/).length, 0) / userEntries.length);
      
      if (data.wordCount > baseAvg * 1.2) {
        insights.push({
          icon: <Clock className="h-5 w-5" />,
          text: `Your entries are ${Math.round((data.wordCount / baseAvg - 1) * 100)}% longer when you write in the ${time.toLowerCase()}.`,
          color: "text-[#B6CAEB]"
        });
      }
    }
    
    // Find most consistent time period
    const mostConsistentTime = Object.entries(hourDistribution)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostConsistentTime) {
      const [time, count] = mostConsistentTime;
      const percentage = Math.round((count / totalEntries) * 100);
      if (percentage >= 40) {
        const timeLabel = time.charAt(0).toUpperCase() + time.slice(1);
        insights.push({
          icon: <Sparkles className="h-5 w-5" />,
          text: `You're most consistent journaling in the ${time} (${percentage}% of entries).`,
          color: "text-[#F5D867]"
        });
      }
    }
    
    // Analyze sentiment patterns
    const sentimentByDay: Record<number, { count: number, total: number }> = {};
    userEntries.forEach(entry => {
      if (entry.sentiment?.score) {
        const day = getDay(new Date(entry.date));
        if (!sentimentByDay[day]) {
          sentimentByDay[day] = { count: 0, total: 0 };
        }
        sentimentByDay[day].count++;
        sentimentByDay[day].total += entry.sentiment.score;
      }
    });
    
    // Calculate average sentiment by day
    const dayToSentiment = Object.entries(sentimentByDay).map(([day, data]) => ({
      day: Number(day),
      dayName: dayNames[Number(day)],
      avgSentiment: data.count > 0 ? data.total / data.count : 0,
      count: data.count
    }));
    
    if (dayToSentiment.length >= 2) {
      // Find the happiest day
      const happiestDay = dayToSentiment
        .filter(d => d.count >= 2)
        .sort((a, b) => b.avgSentiment - a.avgSentiment)[0];
        
      if (happiestDay && happiestDay.avgSentiment > 0.6) {
        insights.push({
          icon: <HeartHandshake className="h-5 w-5" />,
          text: `Your ${happiestDay.dayName} entries tend to be the most positive and uplifting.`,
          color: "text-[#F5B8DB]"
        });
      }
    }
    
    // Analyze emotion patterns
    const emotionsByEntry = userEntries
      .filter(entry => entry.sentiment?.emotions && entry.sentiment.emotions.length > 0)
      .map(entry => ({
        date: new Date(entry.date),
        emotions: entry.sentiment?.emotions || []
      }));
    
    if (emotionsByEntry.length >= 3) {
      // Check for gratitude in weekend vs weekday
      const weekendGratitude = emotionsByEntry
        .filter(e => [0, 6].includes(e.date.getDay()) && e.emotions.some(emotion => 
          ["Grateful", "Thankful", "Appreciative", "Blessed"].includes(emotion)
        )).length;
        
      const weekdayGratitude = emotionsByEntry
        .filter(e => ![0, 6].includes(e.date.getDay()) && e.emotions.some(emotion => 
          ["Grateful", "Thankful", "Appreciative", "Blessed"].includes(emotion)
        )).length;
      
      const weekendEntries = emotionsByEntry.filter(e => [0, 6].includes(e.date.getDay())).length;
      const weekdayEntries = emotionsByEntry.filter(e => ![0, 6].includes(e.date.getDay())).length;
      
      const weekendGratitudeRate = weekendEntries > 0 ? weekendGratitude / weekendEntries : 0;
      const weekdayGratitudeRate = weekdayEntries > 0 ? weekdayGratitude / weekdayEntries : 0;
      
      if (weekendGratitudeRate > weekdayGratitudeRate * 1.5 && weekendEntries >= 2) {
        insights.push({
          icon: <Star className="h-5 w-5" />,
          text: "You express gratitude more often in weekend entries than on weekdays.",
          color: "text-[#F5D867]"
        });
      }
    }
    
    // Analyze entry length patterns
    const entriesByLength = userEntries.map(entry => ({
      date: new Date(entry.date),
      words: entry.content.split(/\s+/).length
    }));
    
    if (entriesByLength.length >= 5) {
      // Are entries getting longer over time?
      const firstFiveAvg = entriesByLength
        .slice(0, Math.min(5, Math.floor(entriesByLength.length / 3)))
        .reduce((acc, e) => acc + e.words, 0) / Math.min(5, Math.floor(entriesByLength.length / 3));
        
      const lastFiveAvg = entriesByLength
        .slice(-Math.min(5, Math.floor(entriesByLength.length / 3)))
        .reduce((acc, e) => acc + e.words, 0) / Math.min(5, Math.floor(entriesByLength.length / 3));
      
      const growthRate = (lastFiveAvg - firstFiveAvg) / firstFiveAvg;
      
      if (growthRate > 0.25) {
        insights.push({
          icon: <BookOpen className="h-5 w-5" />,
          text: `Your entries have grown ${Math.round(growthRate * 100)}% longer since you started journaling.`,
          color: "text-[#9AAB63]"
        });
      } else if (growthRate < -0.25) {
        insights.push({
          icon: <BookOpen className="h-5 w-5" />,
          text: `Your entries have become more concise (${Math.round(Math.abs(growthRate) * 100)}% shorter) recently.`,
          color: "text-[#B6CAEB]"
        });
      }
    }
    
    // Add placeholder insights if we don't have enough data-driven ones
    if (insights.length < 2) {
      insights.push({
        icon: <Lightbulb className="h-5 w-5" />,
        text: "Continue journaling regularly to reveal more patterns in your writing habits.",
        color: "text-[#F5D867]"
      });
    }
    
    return insights;
  };
  
  const insights = generateInsights();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <h3 className="text-xl font-bold mb-4 font-['Montserrat_Variable']">Reflection Patterns</h3>
      
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Montserrat_Variable']">
            <Brain className="h-5 w-5 text-[#9AAB63]" />
            Writing Patterns
          </CardTitle>
          <CardDescription>
            Insights about your journaling habits and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-6">
              {insights.map((insight, index) => (
                <div key={index} className="flex gap-3">
                  <div className={`flex-shrink-0 mt-0.5 ${insight.color}`}>
                    {insight.icon}
                  </div>
                  <div>
                    <p className="text-gray-700">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Glasses className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Not enough data yet</h3>
              <p className="text-gray-500 max-w-md">
                Continue journaling regularly to uncover patterns and insights about your writing habits.
                We need at least 3-5 entries to start identifying meaningful patterns.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}