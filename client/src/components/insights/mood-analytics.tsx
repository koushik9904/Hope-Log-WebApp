import { useState } from "react";
import { Mood, JournalEntry } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Smile,
  Calendar,
  TrendingUp,
  Heart,
  Award,
  Frown,
  Meh,
  Zap,
  Cloud,
  Info as InfoIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MoodChart, MoodData } from "@/components/ui/chart";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MoodAnalyticsProps {
  moods: Mood[];
  entries: JournalEntry[];
  timeframe?: "week" | "month" | "year" | "all";
  isLoading?: boolean;
  className?: string;
}

export function MoodAnalytics({ moods, entries, timeframe = "week", isLoading, className }: MoodAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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
  
  // Function to get mood emoji
  function getMoodEmoji(rating: number): JSX.Element {
    switch(rating) {
      case 1: return <Frown className="h-5 w-5 text-red-500" />;
      case 2: return <Frown className="h-5 w-5 text-orange-400" />;
      case 3: return <Meh className="h-5 w-5 text-yellow-500" />;
      case 4: return <Smile className="h-5 w-5 text-green-500" />;
      case 5: return <Smile className="h-5 w-5 text-green-600" />;
      default: return <Meh className="h-5 w-5 text-gray-400" />;
    }
  }

  // Filter moods based on timeframe
  const getFilteredMoods = () => {
    if (moods.length === 0) return [];
    
    const now = new Date();
    const filtered = moods.filter(mood => {
      const moodDate = new Date(mood.date);
      
      switch(selectedTimeframe) {
        case "week":
          return now.getTime() - moodDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now.getTime() - moodDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
        case "year":
          return now.getTime() - moodDate.getTime() <= 365 * 24 * 60 * 60 * 1000;
        case "all":
        default:
          return true;
      }
    });
    
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  const filteredMoods = getFilteredMoods();
  
  // Convert mood data for chart
  const moodChartData: MoodData[] = filteredMoods.map(mood => ({
    date: format(new Date(mood.date), 'MM/dd/yyyy'),
    mood: mood.rating,
    label: getMoodLabel(mood.rating)
  }));
  
  // Calculate average mood score
  const avgMoodScore = filteredMoods.length > 0
    ? +(filteredMoods.reduce((acc, mood) => acc + mood.rating, 0) / filteredMoods.length).toFixed(1)
    : 0;
  
  // Find most common mood
  const moodCounts = filteredMoods.reduce((acc, mood) => {
    const label = getMoodLabel(mood.rating);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  
  // Identify best and worst days
  const getDayMoodAverages = () => {
    const dayAverages: Record<number, { total: number, count: number }> = {
      0: { total: 0, count: 0 }, // Sunday
      1: { total: 0, count: 0 }, // Monday
      2: { total: 0, count: 0 }, // Tuesday
      3: { total: 0, count: 0 }, // Wednesday
      4: { total: 0, count: 0 }, // Thursday
      5: { total: 0, count: 0 }, // Friday
      6: { total: 0, count: 0 }, // Saturday
    };
    
    filteredMoods.forEach(mood => {
      const date = new Date(mood.date);
      const day = date.getDay();
      dayAverages[day].total += mood.rating;
      dayAverages[day].count += 1;
    });
    
    const result = Object.entries(dayAverages).map(([day, data]) => ({
      day: Number(day),
      dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(day)],
      average: data.count > 0 ? data.total / data.count : 0,
      count: data.count
    }));
    
    return result.filter(item => item.count > 0);
  };
  
  const dayAverages = getDayMoodAverages();
  const bestDay = dayAverages.sort((a, b) => b.average - a.average)[0];
  const worstDay = dayAverages.sort((a, b) => a.average - b.average)[0];
  
  // Create mood heatmap data
  const generateHeatmapData = () => {
    const now = new Date();
    let startDate: Date;
    
    switch(selectedTimeframe) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
        break;
      case "all":
      default:
        if (filteredMoods.length > 0) {
          const dates = filteredMoods.map(m => new Date(m.date));
          startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        } else {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
        }
    }
    
    const weekStart = startOfWeek(startDate);
    const weekEnd = endOfWeek(now);
    
    const allDays = eachDayOfInterval({
      start: weekStart,
      end: weekEnd
    });
    
    // Create a map for quick mood lookup by date string
    const moodByDate: Record<string, number> = {};
    filteredMoods.forEach(mood => {
      const dateStr = new Date(mood.date).toISOString().split('T')[0];
      moodByDate[dateStr] = mood.rating;
    });
    
    // Group days by week
    const weeks: { week: string, days: { date: string, day: number, mood: number | null }[] }[] = [];
    
    let currentWeek: { date: string, day: number, mood: number | null }[] = [];
    let currentWeekStart: Date | null = null;
    
    allDays.forEach(day => {
      const dayOfWeek = getDay(day);
      
      // If we're at the start of a week or this is our first iteration
      if (dayOfWeek === 0 || currentWeek.length === 0) {
        // If we have a partial week, add it before starting a new one
        if (currentWeek.length > 0) {
          // Pad the start of the first week if needed
          if (weeks.length === 0) {
            const firstDay = getDay(new Date(currentWeek[0].date));
            for (let i = 0; i < firstDay; i++) {
              currentWeek.unshift({ date: '', day: i, mood: null });
            }
          }
          
          weeks.push({
            week: currentWeekStart ? format(currentWeekStart, 'MMM d') : '',
            days: currentWeek
          });
        }
        
        currentWeek = [];
        currentWeekStart = day;
      }
      
      const dateStr = day.toISOString().split('T')[0];
      currentWeek.push({
        date: dateStr,
        day: dayOfWeek,
        mood: moodByDate[dateStr] || null
      });
    });
    
    // Add the last week
    if (currentWeek.length > 0) {
      weeks.push({
        week: currentWeekStart ? format(currentWeekStart, 'MMM d') : '',
        days: currentWeek
      });
    }
    
    return weeks;
  };
  
  const heatmapData = generateHeatmapData();
  
  // Get color for mood rating in heatmap
  const getMoodColor = (mood: number | null): string => {
    if (mood === null) return 'bg-gray-100';
    
    switch(mood) {
      case 1: return 'bg-red-200';
      case 2: return 'bg-orange-200';
      case 3: return 'bg-yellow-200';
      case 4: return 'bg-green-200';
      case 5: return 'bg-green-300';
      default: return 'bg-gray-200';
    }
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold font-['Montserrat_Variable']">Mood Analytics</h3>
        
        <Select
          value={selectedTimeframe}
          onValueChange={setSelectedTimeframe}
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
            <Smile className="h-4 w-4 text-[#F5D867]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {avgMoodScore > 0 ? avgMoodScore : "N/A"}
              {avgMoodScore > 0 && getMoodEmoji(Math.round(avgMoodScore))}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button">
                      <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="w-80 p-4">
                    <p className="font-medium mb-1">About Mood Ratings:</p>
                    <p className="text-sm text-gray-700 mb-2">Mood is rated on a scale from 1 to 5:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center"><Frown className="h-4 w-4 text-red-500" /></div>
                        <span className="text-sm text-gray-700">1: Very Sad</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center"><Frown className="h-4 w-4 text-orange-400" /></div>
                        <span className="text-sm text-gray-700">2: Sad</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center"><Meh className="h-4 w-4 text-yellow-500" /></div>
                        <span className="text-sm text-gray-700">3: Neutral</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center"><Smile className="h-4 w-4 text-green-500" /></div>
                        <span className="text-sm text-gray-700">4: Happy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center"><Smile className="h-4 w-4 text-green-600" /></div>
                        <span className="text-sm text-gray-700">5: Very Happy</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on {filteredMoods.length} mood records
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Common Mood</CardTitle>
            <Heart className="h-4 w-4 text-[#F5B8DB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostCommonMood}</div>
            <p className="text-xs text-gray-500 mt-1">
              Your frequent emotional state
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{bestDay?.average > worstDay?.average ? "Best Day" : "Day Pattern"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#9AAB63]" />
          </CardHeader>
          <CardContent>
            {bestDay && bestDay.average > worstDay.average ? (
              <>
                <div className="text-xl font-bold">{bestDay.dayName}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Your happiest day on average
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-medium">Consistent</div>
                <p className="text-xs text-gray-500 mt-1">
                  Your mood is similar across days
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <Card className="lg:col-span-3 bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Mood Trends</CardTitle>
            <CardDescription>
              Your emotional journey for the {selectedTimeframe === 'week' ? 'past week' : selectedTimeframe === 'month' ? 'past month' : selectedTimeframe === 'year' ? 'past year' : 'entire period'}
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
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Day Insights</CardTitle>
            <CardDescription>
              How your mood varies by day of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {dayAverages.length > 0 ? (
              <div className="space-y-4">
                {dayAverages
                  .sort((a, b) => a.day - b.day)
                  .map((dayData) => (
                    <div key={dayData.day} className="flex items-center justify-between">
                      <span className="font-medium w-24">{dayData.dayName}</span>
                      <div className="flex-1 mx-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-red-200 via-yellow-200 to-green-300"
                          style={{ 
                            clipPath: `polygon(0 0, ${Math.max(0, Math.min(100, dayData.average / 5 * 100))}% 0, ${Math.max(0, Math.min(100, dayData.average / 5 * 100))}% 100%, 0 100%)` 
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{dayData.average.toFixed(1)}</span>
                        {getMoodEmoji(Math.round(dayData.average))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Calendar className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500">
                  Not enough data to show day patterns
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-white border-0 shadow-sm mb-8">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="font-['Montserrat_Variable']">Mood Calendar</CardTitle>
          <CardDescription>
            Calendar view of your moods over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 overflow-x-auto">
          {filteredMoods.length > 0 ? (
            <>
              <div className="mb-4 flex justify-between items-center">
                <button 
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  onClick={() => {
                    const prevMonth = new Date(currentMonth);
                    prevMonth.setMonth(currentMonth.getMonth() - 1);
                    setCurrentMonth(prevMonth);
                  }}
                >
                  <span className="rotate-180">➔</span> Previous
                </button>
                
                <h4 className="text-base font-medium">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                
                <button 
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  onClick={() => {
                    const nextMonth = new Date(currentMonth);
                    nextMonth.setMonth(currentMonth.getMonth() + 1);
                    setCurrentMonth(nextMonth);
                  }}
                >
                  Next <span>➔</span>
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow">
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                    <div key={i} className="bg-white p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {/* Generate calendar days for current month */}
                  {(() => {
                    const today = new Date();
                    const displayMonth = currentMonth.getMonth();
                    const displayYear = currentMonth.getFullYear();
                    
                    const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
                    const lastDayOfMonth = new Date(displayYear, displayMonth + 1, 0);
                    
                    const daysInMonth = lastDayOfMonth.getDate();
                    const startingDayOfWeek = firstDayOfMonth.getDay();
                    
                    // Create a map for quick mood lookup by date string
                    const moodByDate: Record<string, number> = {};
                    filteredMoods.forEach(mood => {
                      const moodDate = new Date(mood.date);
                      if (moodDate.getMonth() === displayMonth && moodDate.getFullYear() === displayYear) {
                        moodByDate[moodDate.getDate()] = mood.rating;
                      }
                    });
                    
                    const days = [];
                    // Empty cells for days before the first day of the month
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="bg-white p-2 min-h-[70px]"></div>
                      );
                    }
                    
                    // Cells for each day of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const isToday = day === today.getDate();
                      const hasMood = day in moodByDate;
                      
                      days.push(
                        <div 
                          key={`day-${day}`} 
                          className={`bg-white p-2 min-h-[70px] relative ${isToday ? 'ring-2 ring-[#F5B8DB] ring-inset' : ''}`}
                        >
                          <div className="absolute top-2 right-2 text-sm text-gray-400">
                            {day}
                          </div>
                          {hasMood && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`absolute bottom-2 right-2 w-8 h-8 ${getMoodColor(moodByDate[day])} rounded-full flex items-center justify-center`}>
                                    {getMoodEmoji(moodByDate[day])}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">
                                    {format(new Date(displayYear, displayMonth, day), 'MMMM d, yyyy')}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    Mood: {getMoodLabel(moodByDate[day])}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-red-200"></div>
                  <span className="text-xs">Very Sad</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-orange-200"></div>
                  <span className="text-xs">Sad</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-yellow-200"></div>
                  <span className="text-xs">Neutral</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                  <span className="text-xs">Happy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                  <span className="text-xs">Very Happy</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No mood data recorded yet</h3>
              <p className="text-gray-500 max-w-md">
                Start tracking your mood daily to see it displayed in this calendar view.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}