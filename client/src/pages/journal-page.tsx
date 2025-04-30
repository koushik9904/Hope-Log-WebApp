import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { JournalEntry } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EntryTypeSelector } from "@/components/journal/entry-type-selector";
import { GenerateTitlesButton } from "@/components/journal/generate-titles-button";
import {
  Calendar,
  MessageSquare,
  Search,
  Filter,
  SortDesc,
  SortAsc,
  Plus,
  BookOpen,
  Clock,
  Trash2,
  RotateCcw,
  Trash,
  ChevronLeft,
  ChevronRight,
  PenLine
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "user" | "ai">("all");
  const [activeTab, setActiveTab] = useState<string>("entries");
  const [showDeleted, setShowDeleted] = useState(false); // Toggle to show/hide deleted entries
  
  // Date navigation state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // Format: YYYY-MM
  );
  const [visibleDatesStart, setVisibleDatesStart] = useState<number>(0);
  
  // Calculate dates in selected month
  const getDatesInMonth = (monthStr: string): Date[] => {
    // Parse the year and month from the YYYY-MM format
    const [year, month] = monthStr.split('-').map(Number);
    
    // JavaScript months are 0-based (0=January, 11=December)
    // Use month-1 for correct JavaScript date
    const monthIndex = month - 1;
    
    // Get first day of the month
    const startDate = new Date(year, monthIndex, 1);
    
    // Get last day of the month by getting day 0 of next month
    const endDate = new Date(year, monthIndex + 1, 0);
    
    const dates: Date[] = [];
    // Create a date object for each day in the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      dates.push(new Date(year, monthIndex, day));
    }
    
    console.log(`Selected month string: ${monthStr}`);
    console.log(`Year: ${year}, Month: ${month} (JavaScript month index: ${monthIndex})`);
    console.log(`First day of month: ${startDate.toLocaleDateString()}`);
    console.log(`Last day of month: ${endDate.toLocaleDateString()}`);
    console.log(`Generated ${dates.length} dates for ${monthStr}`);
    
    return dates;
  };
  
  const [datesInMonth, setDatesInMonth] = useState<Date[]>([]);
  
  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    console.log(`Changing month to: ${newMonth}`);
    setSelectedMonth(newMonth);
    setVisibleDatesStart(0); // Reset to beginning of the month
    
    // Update the dates array when the month changes
    const newDates = getDatesInMonth(newMonth);
    setDatesInMonth(newDates);
    
    // Set the selected date to the first day of the month
    setSelectedDate(newDates[0]);
  };
  
  // Initialize dates on component mount
  useEffect(() => {
    console.log("Initializing dates for current month");
    const initialDates = getDatesInMonth(selectedMonth);
    setDatesInMonth(initialDates);
  }, []);
  
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
  } = useQuery<JournalEntry[], Error>({
    queryKey: ["/api/journal", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Handle request for deleted entries differently
      const url = showDeleted 
        ? "/api/journal/deleted" 
        : "/api/journal";
      
      const res = await apiRequest("GET", url);
      const data = await res.json();
      return data;
    },
    enabled: !!user,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const res = await apiRequest("DELETE", `/api/journal/${entryId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry moved to trash",
        description: "The journal entry has been moved to the trash bin.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const restoreMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const res = await apiRequest("POST", `/api/journal/${entryId}/restore`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry restored",
        description: "The journal entry has been restored.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const permanentDeleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const res = await apiRequest("DELETE", `/api/journal/${entryId}/permanent`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry permanently deleted",
        description: "The journal entry has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter entries based on search term, filter type, and selected date
  const filteredEntries = entries
    .filter((entry) => {
      // Filter by search term
      if (searchTerm) {
        const content = entry.content.toLowerCase();
        return content.includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .filter((entry) => {
      // Filter by entry type (all, user, ai)
      if (filterType === "user") {
        return entry.type === "user";
      } else if (filterType === "ai") {
        return entry.type === "ai";
      }
      return true;
    })
    .filter((entry) => {
      // Filter by selected date - if in entries tab and a date is selected
      if (activeTab === "entries" && selectedDate) {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getFullYear() === selectedDate.getFullYear() &&
          entryDate.getMonth() === selectedDate.getMonth() &&
          entryDate.getDate() === selectedDate.getDate()
        );
      }
      return true;
    });
  
  // Convert date to day name
  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  // Sort entries by date
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });
  
  // Group entries by date - for the entries list 
  const entriesByDate = sortedEntries.reduce((groups, entry) => {
    const date = new Date(entry.date).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, JournalEntry[]>);
  
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Journal</h1>
              <p className="text-gray-500 mt-1">
                Record your thoughts, feelings, and experiences
              </p>
            </div>

            <div className="flex items-center mt-4 md:mt-0">
              <Button
                asChild
                className="bg-[#9AAB63] hover:bg-[#9AAB63]/90"
              >
                <Link to="/journal/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Entry
                </Link>
              </Button>
              
              <GenerateTitlesButton />
            </div>
          </div>

          <Tabs
            defaultValue="entries"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b border-gray-200">
              <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="entries"
                  className="flex items-center justify-center data-[state=active]:border-[#9AAB63] data-[state=active]:text-[#9AAB63] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Entries
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="flex items-center justify-center data-[state=active]:border-[#9AAB63] data-[state=active]:text-[#9AAB63] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger
                  value="recycle-bin"
                  className="flex items-center justify-center data-[state=active]:border-[#9AAB63] data-[state=active]:text-[#9AAB63] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Recycle Bin
                </TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="entries">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search entries"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select
                    value={filterType}
                    onValueChange={(value) => setFilterType(value as "all" | "user" | "ai")}
                  >
                    <SelectTrigger className="ml-2 w-[180px]">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entries</SelectItem>
                      <SelectItem value="user">Your Entries</SelectItem>
                      <SelectItem value="ai">AI Responses</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="ml-2"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  >
                    {sortOrder === "desc" ? (
                      <SortDesc className="h-4 w-4" />
                    ) : (
                      <SortAsc className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {selectedDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Today
                    </Button>
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="pi-thinking-dots">
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                  </div>
                </div>
              ) : isError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">Error loading entries</div>
                  <p className="text-gray-500">{error?.message}</p>
                </div>
              ) : sortedEntries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No journal entries found</p>
                  {selectedDate && (
                    <p className="text-gray-400 mt-2">
                      Try selecting a different date or creating a new entry
                    </p>
                  )}
                  <Button
                    className="mt-4 bg-[#9AAB63] hover:bg-[#9AAB63]/90"
                    asChild
                  >
                    <Link to="/journal/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Entry
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(entriesByDate).map(([date, dateEntries]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center">
                        <div className="bg-[#F5B8DB]/20 text-[#F5B8DB] rounded-md px-2 py-1 text-sm font-medium">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="ml-2 text-sm text-gray-500">
                          {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {dateEntries.map((entry) => (
                          <div 
                            key={entry.id} 
                            className="border border-gray-200 rounded-lg p-4 hover:border-[#9AAB63]/50 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-lg mb-1 text-gray-900">
                                  {entry.title || "Untitled Entry"}
                                </h3>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(entry.date).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                  <span className="mx-2">•</span>
                                  <EntryTypeSelector entry={entry} />
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <Link to={`/journal/${entry.id}`}>
                                    <PenLine className="h-4 w-4" />
                                  </Link>
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Move to trash?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This entry will be moved to the recycle bin. You can restore it later if needed.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteMutation.mutate(entry.id)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Move to Trash
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                              {entry.content}
                            </p>
                            
                            <div className="mt-2">
                              <Link
                                to={`/journal/${entry.id}`}
                                className="text-[#9AAB63] hover:underline text-sm"
                              >
                                Read more
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Calendar View</h3>
                <div className="flex items-center space-x-3">
                  {/* Month navigation controls */}
                  <div className="flex items-center space-x-2 mr-4">
                    <Select
                      value={selectedMonth}
                      onValueChange={(value) => {
                        console.log(`Calendar View: changing month to ${value}`);
                        handleMonthChange(value);
                      }}
                    >
                      <SelectTrigger className="h-9 w-[180px]">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select month" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {/* Generate options for past 12 months */}
                        {[...Array(12)].map((_, monthIndex) => {
                          const date = new Date();
                          date.setMonth(date.getMonth() - monthIndex);
                          const monthValue = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                          const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                          return (
                            <SelectItem key={monthIndex} value={monthValue}>
                              {monthName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Navigate to previous month
                        const [year, month] = selectedMonth.split('-').map(Number);
                        let newMonth = month - 1;
                        let newYear = year;
                        if (newMonth < 1) {
                          newMonth = 12;
                          newYear -= 1;
                        }
                        const formattedMonth = `${newYear}-${newMonth.toString().padStart(2, '0')}`;
                        handleMonthChange(formattedMonth);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Navigate to next month
                        const [year, month] = selectedMonth.split('-').map(Number);
                        let newMonth = month + 1;
                        let newYear = year;
                        if (newMonth > 12) {
                          newMonth = 1;
                          newYear += 1;
                        }
                        const formattedMonth = `${newYear}-${newMonth.toString().padStart(2, '0')}`;
                        handleMonthChange(formattedMonth);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {entries.length} total entries
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="pi-thinking-dots">
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                  </div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No journal entries found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Calendar Display */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-[#9AAB63]/10 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="text-lg font-medium text-[#9AAB63]">
                        {(() => {
                          const [year, month] = selectedMonth.split('-').map(Number);
                          return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                        })()}
                      </h4>
                      <div className="text-sm">
                        {(() => {
                          const [year, month] = selectedMonth.split('-').map(Number);
                          return entries.filter(entry => {
                            const date = new Date(entry.date);
                            return date.getFullYear() === year && date.getMonth() === month - 1;
                          }).length;
                        })()} entries this month
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 mb-2 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-xs font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-1">
                        {(() => {
                          // Get the month data
                          const [year, month] = selectedMonth.split('-').map(Number);
                          
                          // Find entries for this month
                          const monthEntries = entries.filter(entry => {
                            const date = new Date(entry.date);
                            return date.getFullYear() === year && date.getMonth() === month - 1;
                          });
                          
                          // Group entries by day
                          const entriesByDay = monthEntries.reduce((acc, entry) => {
                            const day = new Date(entry.date).getDate();
                            if (!acc[day]) acc[day] = [];
                            acc[day].push(entry);
                            return acc;
                          }, {} as Record<number, JournalEntry[]>);
                          
                          // Calculate days in month and first day of month
                          const daysInMonth = new Date(year, month, 0).getDate();
                          const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
                          
                          // Create calendar grid
                          const calendarDays = [];
                          
                          // Add empty cells for days before the 1st of the month
                          for (let i = 0; i < firstDayOfMonth; i++) {
                            calendarDays.push(null);
                          }
                          
                          // Add days of the month
                          for (let day = 1; day <= daysInMonth; day++) {
                            calendarDays.push(day);
                          }
                          
                          // Group into weeks
                          const weeks = [];
                          for (let i = 0; i < calendarDays.length; i += 7) {
                            weeks.push(calendarDays.slice(i, i + 7));
                          }
                          
                          // If the last week is not full, add empty days
                          const lastWeek = weeks[weeks.length - 1];
                          if (lastWeek && lastWeek.length < 7) {
                            for (let i = lastWeek.length; i < 7; i++) {
                              lastWeek.push(null);
                            }
                          }
                          
                          // Render weeks
                          return weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="grid grid-cols-7 gap-1">
                              {week.map((day, dayIndex) => {
                                if (day === null) {
                                  return <div key={`empty-${dayIndex}`} className="aspect-square p-1"></div>;
                                }
                                
                                const hasEntries = !!entriesByDay[day];
                                const dayEntries = entriesByDay[day] || [];
                                
                                // Create a date object for this day
                                const dayDate = new Date(year, month - 1, day);
                                const isToday = new Date().toDateString() === dayDate.toDateString();
                                
                                return (
                                  <div 
                                    key={day} 
                                    className={`
                                      relative rounded-md border group hover:border-[#9AAB63]/50 transition-colors
                                      ${hasEntries ? 'border-[#9AAB63]/30 bg-[#9AAB63]/5' : 'border-gray-200'} 
                                      ${isToday ? 'ring-2 ring-[#F5B8DB] ring-inset' : ''}
                                      aspect-square flex flex-col items-center justify-start overflow-hidden cursor-pointer
                                    `}
                                    onClick={() => {
                                      setSelectedDate(dayDate);
                                      setActiveTab('entries');
                                    }}
                                  >
                                    <div className={`
                                      w-full text-center py-1.5 text-sm
                                      ${hasEntries ? 'font-medium text-[#9AAB63]' : 'text-gray-700'}
                                      ${isToday ? 'font-bold' : ''}
                                    `}>
                                      {day}
                                    </div>
                                    
                                    {hasEntries && (
                                      <div className="absolute bottom-1 w-full px-1 flex justify-center">
                                        <div className={`
                                          text-xs ${dayEntries.length > 1 ? 'bg-[#9AAB63]' : 'bg-[#9AAB63]/70'} text-white 
                                          rounded-full px-1.5 py-0.5 font-medium
                                        `}>
                                          {dayEntries.length}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Entries for Selected Month */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-4">
                      Recent Entries in {(() => {
                        const [year, month] = selectedMonth.split('-').map(Number);
                        return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
                      })()}
                    </h4>
                    
                    {(() => {
                      const [year, month] = selectedMonth.split('-').map(Number);
                      const monthEntries = entries.filter(entry => {
                        const date = new Date(entry.date);
                        return date.getFullYear() === year && date.getMonth() === month - 1;
                      });
                      
                      if (monthEntries.length === 0) {
                        return (
                          <div className="text-center py-6 text-gray-500">
                            No entries found for this month
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {monthEntries
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 5)
                            .map(entry => (
                              <Link
                                key={entry.id}
                                to={`/journal/${entry.id}`}
                                className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium text-gray-800">
                                      {entry.title || "Untitled Entry"}
                                    </h5>
                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                      {entry.content}
                                    </p>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </Link>
                            ))}
                            
                          {monthEntries.length > 5 && (
                            <Button
                              variant="ghost"
                              className="w-full text-[#9AAB63]"
                              onClick={() => setActiveTab('entries')}
                            >
                              View all {monthEntries.length} entries
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recycle-bin">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Deleted Entries</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleted(true);
                    queryClient.invalidateQueries({ queryKey: ["/api/journal", user?.id] });
                  }}
                  className="text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="pi-thinking-dots">
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                  </div>
                </div>
              ) : sortedEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No deleted entries found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg mb-1 text-gray-900">
                            {entry.title || "Untitled Entry"}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                            <span className="mx-2">•</span>
                            <EntryTypeSelector entry={entry} />
                            <Badge variant="outline" className="ml-2 text-xs">Deleted</Badge>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreMutation.mutate(entry.id)}
                            className="text-[#9AAB63]"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Permanently delete entry?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The entry will be permanently deleted from the database.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => permanentDeleteMutation.mutate(entry.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete Forever
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 line-clamp-2 mt-2">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}