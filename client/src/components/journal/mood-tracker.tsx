import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MoodChart, MoodData } from "@/components/ui/chart";
import { MoodEmoji } from "@/components/ui/mood-emoji";
import { format, subDays } from "date-fns";
import { User, Mood } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Heart, Smile, BarChart2, ChevronRight, Info } from "lucide-react";

type MoodTrackerProps = {
  userId: number;
};

export function MoodTracker({ userId }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  
  // Fetch mood data for the past week
  const { data: moods, isLoading } = useQuery<Mood[]>({
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
        mood: dayMood ? dayMood.rating : 0, // 0 means no mood recorded
        label: dayLabel
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
    <div className="pi-card">
      <div className="pi-card-header">
        <div className="flex items-center">
          <div className="rounded-md bg-blue-100 p-1.5 mr-2">
            <Smile className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="pi-card-title">Mood Insights</h2>
            <p className="pi-card-subtitle">Track your emotional patterns</p>
          </div>
        </div>
        <button className="text-blue-500 flex items-center text-sm font-medium">
          <BarChart2 className="h-4 w-4 mr-1" /> More stats
        </button>
      </div>
      
      {/* Mood Chart with insights */}
      <div className="mb-6">
        {isLoading ? (
          <Skeleton className="w-full h-[180px]" />
        ) : (
          <>
            <MoodChart data={chartData} height={180} />
            
            {/* Pi.ai style insight card */}
            {moods && moods.length > 0 && (
              <div className="mt-4 border border-blue-100 rounded-lg p-3 bg-blue-50 flex items-start">
                <Info className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    Your mood has been mostly positive this week. Your happiness levels tend to peak on weekends.
                  </p>
                  <button className="text-sm text-primary font-medium mt-1 flex items-center">
                    See pattern analysis <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Today's Mood */}
      <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
        <h3 className="text-md font-semibold mb-4 text-gray-800 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-rose-500" />
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
