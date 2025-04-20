import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MoodChart, MoodData } from "@/components/ui/chart";
import { MoodEmoji } from "@/components/ui/mood-emoji";
import { format, subDays } from "date-fns";
import { User, Mood, JournalEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Heart, Smile, BarChart2, ChevronRight, Info } from "lucide-react";
import { Link } from "wouter";

type MoodTrackerProps = {
  userId: number;
};

export function MoodTracker({ userId }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  
  // Fetch mood data for the past week
  const { data: moods = [], isLoading } = useQuery<Mood[]>({
    queryKey: [`/api/moods/${userId}`],
  });
  
  // Record today's mood
  const recordMoodMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiRequest("POST", "/api/moods", {
        userId,
        rating,
        date: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/moods/${userId}`] });
    },
  });
  
  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
    recordMoodMutation.mutate(mood);
  };
  
  // Fetch journal entries to access sentiment analysis data
  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${userId}`],
  });

  // Format mood data for the chart
  const chartData: MoodData[] = [];
  
  if ((moods && moods.length > 0) || (entries && entries.length > 0)) {
    // Create data for the past 7 days
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "EEE");
      
      // Find self-reported mood for this day if it exists
      const dayMood = moods.find(m => {
        const moodDate = new Date(m.date);
        return format(moodDate, "yyyy-MM-dd") === dateStr;
      });
      
      // Find journal entries with sentiment analysis for this day
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return format(entryDate, "yyyy-MM-dd") === dateStr && 
               entry.sentiment && 
               entry.sentiment.score !== undefined;
      });
      
      // Calculate average sentiment score from journal entries for this day
      let sentimentScore = 0;
      if (dayEntries.length > 0) {
        // Convert sentiment scores (typically -1 to 1 range) to mood scale (1-5)
        // and calculate average
        const totalScore = dayEntries.reduce((sum, entry) => {
          // Assuming sentiment.score is between -1 and 1
          // Convert to 1-5 scale: (score + 1) * 2 + 1
          const moodScore = Math.round((entry.sentiment!.score + 1) * 2 + 1);
          // Clamp between 1-5
          return sum + Math.min(5, Math.max(1, moodScore));
        }, 0);
        
        sentimentScore = totalScore / dayEntries.length;
      }
      
      // Use self-reported mood if available, otherwise use derived sentiment score
      const finalMoodScore = dayMood ? dayMood.rating : 
                           (sentimentScore > 0 ? sentimentScore : 0);
      
      chartData.push({
        date: dateStr,
        mood: finalMoodScore, // 0 means no mood recorded
        label: dayLabel,
        // Include both sources so tooltip can show them
        selfReportedMood: dayMood ? dayMood.rating : undefined,
        sentimentMood: sentimentScore > 0 ? sentimentScore : undefined
      });
    }
  } else if (!isLoading) {
    // If no moods yet, create empty chart data
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "EEE");
      
      chartData.push({
        date: dateStr,
        mood: 0, // 0 means no mood recorded
        label: dayLabel
      });
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="rounded-md bg-[#F5B8DB]/10 p-1.5 mr-2">
            <Smile className="h-5 w-5 text-[#F5B8DB]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Mood Insights</h2>
            <p className="text-sm text-gray-500">Track your emotional patterns</p>
          </div>
        </div>
        <Link to="/insights" className="text-[#9AAB63] flex items-center text-sm font-medium hover:underline">
          <BarChart2 className="h-4 w-4 mr-1" /> More stats
        </Link>
      </div>
      
      {/* Mood Chart with insights */}
      <div className="mb-6">
        {isLoading ? (
          <Skeleton className="w-full h-[180px]" />
        ) : (
          <>
            <MoodChart data={chartData} height={180} />
            
            {/* Insight card */}
            {(moods && moods.length > 0) || (entries && entries.some(e => e.sentiment?.score !== undefined)) ? (
              <div className="mt-4 border border-[#B6CAEB]/30 rounded-lg p-3 bg-[#B6CAEB]/10 flex items-start">
                <Info className="h-5 w-5 text-[#B6CAEB] mr-2 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    {moods && moods.length > 0 && entries && entries.some(e => e.sentiment?.score !== undefined) ? (
                      "Your mood tracker now combines both self-reported feelings and sentiment from your journal entries for a complete emotional picture."
                    ) : moods && moods.length > 0 ? (
                      "Your mood has been tracked based on your self-reports. Journal entries with sentiment analysis will also appear here."
                    ) : (
                      "Your mood is being tracked based on the sentiment in your journal entries. You can also record your mood directly."
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-[#F5B8DB]/10 rounded-full flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#F5B8DB] mr-1"></span>
                      Self-reported
                    </span>
                    <span className="text-xs px-2 py-1 bg-[#B6CAEB]/10 rounded-full flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#B6CAEB] mr-1"></span>
                      From journal
                    </span>
                  </div>
                  <Link to="/insights" className="text-sm text-[#9AAB63] font-medium mt-2 flex items-center hover:text-[#B6CAEB] hover:underline">
                    See pattern analysis <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
      
      {/* Today's Mood */}
      <div className="border border-[#F5B8DB]/20 p-4 rounded-lg bg-[#F5B8DB]/5">
        <h3 className="text-md font-semibold mb-4 text-gray-800 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-[#F5B8DB]" />
          How are you feeling today?
        </h3>
        <div className="flex justify-between px-4">
          <MoodEmoji 
            mood={1} 
            label="Sad" 
            isSelected={selectedMood === 1} 
            onClick={handleMoodSelect} 
          />
          <MoodEmoji 
            mood={2} 
            label="Worried" 
            isSelected={selectedMood === 2} 
            onClick={handleMoodSelect} 
          />
          <MoodEmoji 
            mood={3} 
            label="Neutral" 
            isSelected={selectedMood === 3} 
            onClick={handleMoodSelect} 
          />
          <MoodEmoji 
            mood={4} 
            label="Good" 
            isSelected={selectedMood === 4} 
            onClick={handleMoodSelect} 
          />
          <MoodEmoji 
            mood={5} 
            label="Great" 
            isSelected={selectedMood === 5} 
            onClick={handleMoodSelect} 
          />
        </div>
      </div>
    </div>
  );
}
