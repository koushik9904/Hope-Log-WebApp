import { JournalEntry } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart2,
  Award,
  ListChecks,
  Clock,
  CalendarDays,
  FileText,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface JournalingStatsProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  className?: string;
}

export function JournalingStats({ entries, isLoading, className }: JournalingStatsProps) {
  // Filter to user-created entries only
  const userEntries = entries.filter(e => !e.isAiResponse);
  
  // Calculate total entries
  const totalEntries = userEntries.length;
  
  // Calculate total words
  const totalWords = userEntries.reduce(
    (acc, entry) => acc + entry.content.split(/\s+/).length, 
    0
  );
  
  // Calculate average words per entry
  const avgWordsPerEntry = totalEntries > 0 
    ? Math.round(totalWords / totalEntries) 
    : 0;
  
  // Calculate longest journaling streak
  const calculateLongestStreak = () => {
    if (userEntries.length === 0) return 0;
    
    // Sort entries by date (oldest first)
    const sortedEntries = [...userEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get unique dates (one entry per day)
    const entryDates = sortedEntries.map(entry => 
      new Date(entry.date).toISOString().split('T')[0]
    );
    const uniqueDates = Array.from(new Set(entryDates));
    
    // Track streaks
    let currentStreak = 1;
    let longestStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i]);
      const previous = new Date(uniqueDates[i-1]);
      
      // Check if consecutive days (add 86400000 ms = 1 day to previous)
      if (current.getTime() - previous.getTime() === 86400000) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  };
  
  const longestStreak = calculateLongestStreak();
  
  // Calculate time of day frequency
  const getTimeOfDayFrequency = () => {
    const timeSlots = {
      morning: { label: "Morning (5AM-12PM)", count: 0 },
      afternoon: { label: "Afternoon (12PM-5PM)", count: 0 },
      evening: { label: "Evening (5PM-9PM)", count: 0 },
      night: { label: "Night (9PM-5AM)", count: 0 }
    };
    
    userEntries.forEach(entry => {
      const date = new Date(entry.date);
      const hour = date.getHours();
      
      if (hour >= 5 && hour < 12) {
        timeSlots.morning.count++;
      } else if (hour >= 12 && hour < 17) {
        timeSlots.afternoon.count++;
      } else if (hour >= 17 && hour < 21) {
        timeSlots.evening.count++;
      } else {
        timeSlots.night.count++;
      }
    });
    
    // Convert to array and sort by count
    return Object.values(timeSlots).sort((a, b) => b.count - a.count);
  };
  
  const timeFrequency = getTimeOfDayFrequency();
  const mostFrequentTime = timeFrequency.length > 0 
    ? timeFrequency[0].label 
    : "N/A";
  
  // Calculate common word usage
  const getWordFrequency = () => {
    const wordMap: Record<string, number> = {};
    const stopWords = new Set([
      "the", "a", "an", "and", "but", "if", "or", "because", "as", "what",
      "which", "this", "that", "these", "those", "then", "just", "so", "than",
      "such", "when", "who", "how", "where", "why", "is", "are", "was", "were",
      "be", "been", "being", "have", "has", "had", "do", "does", "did", "but",
      "at", "by", "for", "with", "about", "against", "between", "into", "through",
      "during", "before", "after", "above", "below", "to", "from", "up", "down",
      "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
      "here", "there", "all", "any", "both", "each", "few", "more", "most", "other",
      "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", 
      "too", "very", "can", "will", "of", "it", "its", "my", "i", "me", "mine",
      "you", "your", "yours", "he", "him", "his", "she", "her", "hers", "they",
      "them", "their", "theirs", "we", "us", "our", "ours"
    ]);
    
    userEntries.forEach(entry => {
      const words = entry.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/); // Split by whitespace
        
      words.forEach(word => {
        if (word.length > 2 && !stopWords.has(word)) {
          wordMap[word] = (wordMap[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(wordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  };
  
  const commonWords = getWordFrequency();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-[#F5B8DB] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <h3 className="text-xl font-bold mb-4 font-['Montserrat_Variable']">Journaling Stats</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <FileText className="h-4 w-4 text-[#9AAB63]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalWords} total words written
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Award className="h-4 w-4 text-[#B6CAEB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak} days</div>
            <p className="text-xs text-gray-500 mt-1">
              Your best journaling streak
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Words Per Entry</CardTitle>
            <ListChecks className="h-4 w-4 text-[#F5B8DB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWordsPerEntry}</div>
            <p className="text-xs text-gray-500 mt-1">
              Average words per journal entry
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorite Time</CardTitle>
            <Clock className="h-4 w-4 text-[#F5D867]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{mostFrequentTime}</div>
            <p className="text-xs text-gray-500 mt-1">
              When you journal most often
            </p>
          </CardContent>
        </Card>
      </div>
      
      {timeFrequency.length > 0 && (
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Journaling Time Patterns</CardTitle>
            <CardDescription>
              When you tend to write in your journal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeFrequency.map((time) => {
                const percentage = Math.round((time.count / totalEntries) * 100) || 0;
                return (
                  <div key={time.label} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{time.label}</span>
                      <span className="text-sm text-gray-500">
                        {time.count} entries ({percentage}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {commonWords.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Most Used Words</CardTitle>
            <CardDescription>
              Words that appear frequently in your entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {commonWords.map(({ word, count }) => (
                <TooltipProvider key={word}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm"
                        style={{ 
                          fontSize: `${Math.max(0.8, Math.min(1.4, 0.8 + (count / (commonWords[0].count * 0.7))) * 100)}%`,
                          fontWeight: count > (commonWords[0].count * 0.6) ? 'bold' : 'normal' 
                        }}
                      >
                        {word}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Used {count} times</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}