import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MoodChart, MoodData } from "@/components/ui/chart";
import { MoodEmoji } from "@/components/ui/mood-emoji";
import { format, subDays } from "date-fns";
import { User, Mood } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type MoodTrackerProps = {
  userId: number;
};

export function MoodTracker({ userId }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  
  // Fetch mood data for the past week
  const { data: moods, isLoading } = useQuery<Mood[]>({
    queryKey: ["/api/moods", userId],
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
      queryClient.invalidateQueries({ queryKey: ["/api/moods", userId] });
    },
  });
  
  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
    recordMoodMutation.mutate(mood);
  };
  
  // Format mood data for the chart
  const chartData: MoodData[] = [];
  
  if (moods && moods.length > 0) {
    // Create data for the past 7 days
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "EEE");
      
      // Find mood for this day if it exists
      const dayMood = moods.find(m => {
        const moodDate = new Date(m.date);
        return format(moodDate, "yyyy-MM-dd") === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        mood: dayMood ? dayMood.rating : 3, // Default to neutral if no mood recorded
        label: dayLabel
      });
    }
  }
  
  return (
    <div className="bg-white rounded-card shadow-sm">
      <div className="p-4 border-b border-neutral-light">
        <h2 className="text-lg font-semibold font-nunito">Mood Tracker</h2>
        <p className="text-neutral-medium text-sm">How are you feeling over time?</p>
      </div>
      
      <div className="p-4">
        {/* Mood Chart */}
        <div className="chart-container mb-6">
          {isLoading ? (
            <Skeleton className="w-full h-[180px]" />
          ) : (
            <MoodChart data={chartData} height={180} />
          )}
        </div>
        
        {/* Today's Mood */}
        <div>
          <h3 className="text-md font-medium mb-3">How are you feeling today?</h3>
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
    </div>
  );
}
