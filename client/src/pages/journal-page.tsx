import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { JournalEntry } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EntryTypeSelector } from "@/components/journal/entry-type-selector";
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
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const dates: Date[] = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      dates.push(new Date(year, month - 1, day));
    }
    return dates;
  };
  
  const datesInMonth = getDatesInMonth(selectedMonth);
  const visibleDates = datesInMonth.slice(visibleDatesStart, visibleDatesStart + 5);
  
  // Calculate if we can navigate dates
  const canNavigatePrevious = visibleDatesStart > 0;
  const canNavigateNext = visibleDatesStart + 5 < datesInMonth.length;
  
  // Initialize with today's date and display selected date info
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    
    // Make sure we're showing the current month that contains today
    const currentMonthStr = today.toISOString().substring(0, 7);
    setSelectedMonth(currentMonthStr);
    
    // Calculate the position to show today in the visible dates
    const daysInCurrentMonth = getDatesInMonth(currentMonthStr);
    const todayIndex = daysInCurrentMonth.findIndex(date => 
      date.getDate() === today.getDate()
    );
    
    // Position the visible dates window to show today
    if (todayIndex >= 0) {
      // Try to position today in the middle of the visible window
      const newStart = Math.max(0, Math.min(todayIndex - 2, daysInCurrentMonth.length - 5));
      setVisibleDatesStart(newStart);
    }
  }, []);
  
  // Change month handler
  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    setVisibleDatesStart(0);
    // If current date is in this month, select it, otherwise select 1st
    const today = new Date();
    const [year, month] = monthStr.split('-').map(Number);
    
    if (today.getFullYear() === year && today.getMonth() === month - 1) {
      setSelectedDate(today);
    } else {
      setSelectedDate(new Date(year, month - 1, 1));
    }
  };
  
  // Navigate dates
  const navigateDates = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && canNavigatePrevious) {
      setVisibleDatesStart(prev => Math.max(0, prev - 5));
    } else if (direction === 'next' && canNavigateNext) {
      setVisibleDatesStart(prev => Math.min(datesInMonth.length - 5, prev + 5));
    }
  };
  
  if (!user) return null;
  
  // Fetch all journal entries
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch deleted journal entries for recycle bin
  const { data: deletedEntries = [], isLoading: isLoadingDeleted } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${user?.id}/deleted`],
    enabled: !!user?.id && showDeleted,
    staleTime: 60000, // 1 minute
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("DELETE", `/api/journal-entries/${entryId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal entry moved to recycle bin",
        description: "The entry will be permanently deleted after 7 days.",
      });
      // Refetch entries
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${user?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting journal entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("POST", `/api/journal-entries/${entryId}/restore`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Journal entry restored",
        description: "The entry has been restored to your journal.",
      });
      // Refetch entries and deleted entries
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${user?.id}/deleted`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error restoring journal entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Permanently delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("DELETE", `/api/journal-entries/${entryId}/permanent`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal entry permanently deleted",
        description: "The entry has been permanently removed.",
      });
      // Refetch deleted entries
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${user?.id}/deleted`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting journal entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter entries based on search term and filter type
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "user") return matchesSearch && !entry.isAiResponse;
    if (filterType === "ai") return matchesSearch && entry.isAiResponse;
    
    return matchesSearch;
  });
  
  // Sort entries based on date
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });
  
  // Get a summary of the total words written
  const totalWords = entries
    .filter(entry => !entry.isAiResponse)
    .reduce((acc, entry) => acc + entry.content.split(/\s+/).length, 0);
  
  // Group entries by date for the chronological view
  const entriesByDate = sortedEntries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    // Convert to user's local timezone
    const entryDate = new Date(entry.date);
    const userTimezone = entry.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDate = new Date(entryDate.toLocaleString('en-US', { timeZone: userTimezone }));
    const dateStr = localDate.toISOString().split('T')[0];
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(entry);
    return acc;
  }, {});
  
  // Extract unique emotions from sentiment analysis
  const emotions = new Set<string>();
  entries.forEach(entry => {
    if (entry.sentiment?.emotions) {
      entry.sentiment.emotions.forEach(emotion => emotions.add(emotion));
    }
  });
  
  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Journal</h1>
            <p className="text-gray-500">
              Review and search your past journal entries
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button className="pi-button flex items-center gap-2">
                  <Plus className="h-4 w-4" /> New Entry
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[650px] p-4">
                <h3 className="font-medium text-lg mb-4">Select Entry Type</h3>
                <EntryTypeSelector 
                  linkMode={true}
                />
              </HoverCardContent>
            </HoverCard>
            
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="font-medium">{entries.length} Entries</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Journal Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Entries</p>
                      <p className="text-xl font-bold">{entries.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Words Written</p>
                      <p className="text-xl font-bold">{totalWords}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your Entries</p>
                      <p className="text-xl font-bold">{entries.filter(e => !e.isAiResponse).length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">AI Responses</p>
                      <p className="text-xl font-bold">{entries.filter(e => e.isAiResponse).length}</p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="entries">All Entries</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="recycle-bin" onClick={() => setShowDeleted(true)}>
              <div className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Recycle Bin
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="entries">
            <div className="mb-8">
              {/* Month selector and date navigation */}
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
                <div className="w-full md:w-60">
                  <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Month
                  </label>
                  <Select
                    value={selectedMonth}
                    onValueChange={handleMonthChange}
                  >
                    <SelectTrigger id="month-select" className="w-full">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select month" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, monthIndex) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - monthIndex);
                        const monthStr = date.toISOString().substring(0, 7);
                        const displayText = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return (
                          <SelectItem key={monthStr} value={monthStr}>
                            {displayText}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <Select 
                    value={filterType} 
                    onValueChange={(value) => setFilterType(value as "all" | "user" | "ai")}
                  >
                    <SelectTrigger className="w-36">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by" />
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
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    className="h-10"
                  >
                    {sortOrder === "desc" ? (
                      <SortDesc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortAsc className="h-4 w-4 mr-2" />
                    )}
                    {sortOrder === "desc" ? "Newest" : "Oldest"}
                  </Button>
                </div>
              </div>
              
              {/* Date navigation */}
              <div className="relative flex items-center mb-6">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 absolute left-0 z-10"
                  onClick={() => navigateDates('prev')}
                  disabled={!canNavigatePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="w-full overflow-hidden px-10">
                  <div className="flex justify-between gap-2">
                    {visibleDates.map((date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const isSelected = date.toDateString() === selectedDate.toDateString();
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={dateStr}
                          className={`flex-1 rounded-lg py-3 px-1 flex flex-col items-center transition-colors
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-gray-100'
                            }
                            ${isToday && !isSelected ? 'border border-primary text-primary' : ''}
                          `}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="text-xs font-medium mb-1">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-lg font-bold ${isSelected ? 'text-primary-foreground' : ''}`}>
                            {date.getDate()}
                          </div>
                          <div className="text-xs mt-1">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 absolute right-0 z-10"
                  onClick={() => navigateDates('next')}
                  disabled={!canNavigateNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9"
                  placeholder="Search journal entries..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
            ) : sortedEntries.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No journal entries found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Try a different search term or clear your filters"
                    : "Start journaling to see your entries here"}
                </p>
                
                {/* Allow adding journal entries for the past */}
                {!searchTerm && (
                  <div className="mt-4">
                    <h3 className="text-xl font-medium mb-4 text-center">
                      {selectedDate.toDateString() === new Date().toDateString()
                        ? "Start Journaling Today"
                        : `Add Journal for ${selectedDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`
                      }
                    </h3>
                    <EntryTypeSelector
                      selectedDate={selectedDate}
                      linkMode={true}
                      className="max-w-4xl mx-auto"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Allow adding journal entries for the selected date if not present */}
                {!Object.keys(entriesByDate).some(dateStr => 
                  dateStr === selectedDate.toISOString().split('T')[0]
                ) && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                    <div className="mb-4">
                      <h3 className="font-medium text-xl text-center">No entries for {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}</h3>
                      <p className="text-sm text-gray-500 text-center mt-1">How would you like to journal for this date?</p>
                    </div>
                    <EntryTypeSelector
                      selectedDate={selectedDate}
                      linkMode={true}
                      className="max-w-4xl mx-auto"
                    />
                  </div>
                )}
              
                {Object.entries(entriesByDate)
                  .filter(([dateString]) => {
                    // Show entries for selected date
                    if (!selectedDate) return true;
                    // Use YYYY-MM-DD format for consistent comparison
                    const selectedDateStr = selectedDate.toISOString().split('T')[0];
                    return dateString === selectedDateStr;
                  })
                  .map(([date, dateEntries]) => (
                  <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-primary mr-2" />
                            <h3 className="font-semibold text-primary">
                              {new Date(dateEntries[0].date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'} in your journal
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {dateEntries.map((entry) => (
                        <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors relative group">
                          <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Move to Recycle Bin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will move the journal entry to the recycle bin. Items in the recycle bin are automatically deleted after 7 days.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteMutation.mutate(entry.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Move to Recycle Bin
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          <Link href={`/journal/${entry.id}`} className="block hover:bg-gray-50/50 -mx-6 -my-6 p-6 rounded-md transition-colors">
                            <div className="flex justify-between items-center">
                              <div className="flex items-end gap-2">
                                <div className="text-xs uppercase text-primary-foreground font-medium px-2 py-0.5 rounded-sm bg-primary/80">
                                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                {entry.isAiResponse && (
                                  <div className="text-xs uppercase text-blue-700 font-medium px-2 py-0.5 rounded-sm bg-blue-100">
                                    AI Response
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                {new Date(entry.date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>
                            
                            <h4 className="font-medium text-xl mt-3 mb-2 text-gray-800">
                              {(() => {
                                // Generate title from content
                                const content = entry.content;
                                if (!content || content.trim() === "") return "Untitled Entry";
                                
                                // Get first sentence or part of it
                                const firstSentence = content.split(/[.!?]/)[0]?.trim();
                                if (!firstSentence) return "Untitled Entry";
                                
                                // If sentence is short enough, use it directly
                                if (firstSentence.length <= 50) {
                                  return firstSentence;
                                }
                                
                                // Otherwise, get first 5-7 words
                                const words = firstSentence.split(/\s+/).slice(0, 7);
                                let title = words.join(" ");
                                
                                // Add ellipsis if we truncated
                                if (words.length < firstSentence.split(/\s+/).length) {
                                  title += "...";
                                }
                                
                                return title;
                              })()}
                            </h4>
                            
                            <div className="mb-3 mt-2 pl-2 border-l-2 border-gray-200">
                              <p className="text-gray-600 line-clamp-3 pl-2 italic font-light">{entry.content}</p>
                            </div>
                            
                            {entry.sentiment && entry.sentiment.emotions && entry.sentiment.emotions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {entry.sentiment.emotions.slice(0, 3).map((emotion, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {emotion}
                                  </Badge>
                                ))}
                                {entry.sentiment.emotions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{entry.sentiment.emotions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Calendar View</h3>
                <div className="text-sm text-muted-foreground">
                  {entries.length} total entries
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
                  {/* Get unique months from entries */}
                  {Array.from(new Set(entries.map(entry => {
                    const date = new Date(entry.date);
                    return `${date.getFullYear()}-${date.getMonth() + 1}`;
                  }))).sort((a, b) => {
                    // Sort by year and month (newest first)
                    const [yearA, monthA] = a.split('-').map(Number);
                    const [yearB, monthB] = b.split('-').map(Number);
                    if (yearA !== yearB) return yearB - yearA;
                    return monthB - monthA;
                  }).map(monthKey => {
                    const [year, month] = monthKey.split('-').map(Number);
                    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
                    
                    // Get entries for this month
                    const monthEntries = entries.filter(entry => {
                      const date = new Date(entry.date);
                      return date.getFullYear() === year && date.getMonth() === month - 1;
                    });
                    
                    // Group by day
                    const entriesByDay = monthEntries.reduce((acc, entry) => {
                      const day = new Date(entry.date).getDate();
                      if (!acc[day]) acc[day] = [];
                      acc[day].push(entry);
                      return acc;
                    }, {} as Record<number, JournalEntry[]>);
                    
                    // Get days in month
                    const daysInMonth = new Date(year, month, 0).getDate();
                    
                    // Create array for calendar grid
                    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
                    const calendarDays = [];
                    
                    // Add days from previous month to fill first week
                    const prevMonthDays = firstDayOfMonth === 0 ? 0 : firstDayOfMonth;
                    for (let i = 0; i < prevMonthDays; i++) {
                      calendarDays.push(null);
                    }
                    
                    // Add days of current month
                    for (let i = 1; i <= daysInMonth; i++) {
                      calendarDays.push(i);
                    }
                    
                    return (
                      <div key={monthKey} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-[#9AAB63]/10 px-4 py-3 font-medium border-b border-gray-200 flex justify-between items-center">
                          <h4 className="text-lg text-[#9AAB63]">{monthName} {year}</h4>
                          <Badge className="bg-[#F5B8DB]/90 hover:bg-[#F5B8DB]">
                            {monthEntries.length} entries
                          </Badge>
                        </div>
                        
                        {/* Calendar grid view */}
                        <div className="p-4">
                          <div className="grid grid-cols-7 mb-2 text-center">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-xs font-medium text-gray-500 py-1">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                              if (day === null) {
                                return <div key={`empty-${index}`} className="aspect-square p-1"></div>;
                              }
                              
                              const hasEntries = !!entriesByDay[day];
                              const dayEntries = entriesByDay[day] || [];
                              
                              return (
                                <div 
                                  key={day} 
                                  className={`
                                    relative rounded-md border group hover:border-[#9AAB63]/50 transition-colors
                                    ${hasEntries ? 'border-[#9AAB63]/30 bg-[#9AAB63]/5' : 'border-gray-200'} 
                                    aspect-square flex flex-col items-center justify-start overflow-hidden
                                  `}
                                >
                                  <div className={`
                                    w-full text-center py-1.5 text-sm
                                    ${hasEntries ? 'font-medium text-[#9AAB63]' : 'text-gray-700'}
                                  `}>
                                    {day}
                                  </div>
                                  
                                  {hasEntries && (
                                    <>
                                      <div className="absolute bottom-1 w-full px-1 flex justify-center">
                                        <div className={`
                                          text-xs ${dayEntries.length > 1 ? 'bg-[#9AAB63]' : 'bg-[#9AAB63]/70'} text-white 
                                          rounded-full px-1.5 py-0.5 font-medium
                                        `}>
                                          {dayEntries.length}
                                        </div>
                                      </div>
                                      
                                      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-1">
                                        <div className="text-center mb-1">
                                          <span className="text-sm font-medium">{dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}</span>
                                        </div>
                                        <div className="w-full">
                                          {dayEntries.slice(0, 2).map(entry => (
                                            <Link 
                                              key={entry.id} 
                                              href={`/journal/${entry.id}`}
                                              className="block text-xs truncate hover:underline py-0.5 text-center text-gray-700"
                                            >
                                              {new Date(entry.date).toLocaleTimeString([], {
                                                hour: 'numeric',
                                                minute: '2-digit'
                                              })}
                                            </Link>
                                          ))}
                                          {dayEntries.length > 2 && (
                                            <div className="text-center text-xs text-[#F5B8DB]">
                                              +{dayEntries.length - 2} more
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* List view of day entries when there are entries */}
                        {Object.keys(entriesByDay).length > 0 && (
                          <div className="border-t border-gray-200 p-4">
                            <h5 className="font-medium mb-3 text-gray-700">Day entries:</h5>
                            {Object.entries(entriesByDay).sort((a, b) => Number(b[0]) - Number(a[0])).map(([day, dayEntries]) => (
                              <div key={day} className="mb-4 last:mb-0">
                                <div className="flex items-center mb-2">
                                  <div className="w-8 h-8 rounded-full bg-[#9AAB63]/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-[#9AAB63]">{day}</span>
                                  </div>
                                  <span className="ml-2 text-sm font-medium">{dayEntries.length} entries</span>
                                </div>
                                <div className="pl-10 space-y-1">
                                  {dayEntries.map(entry => (
                                    <Link 
                                      key={entry.id} 
                                      href={`/journal/${entry.id}`}
                                      className="flex items-center text-sm hover:underline py-1 text-gray-600 hover:text-gray-900"
                                    >
                                      <span className="w-14 text-xs flex items-center">
                                        <Clock className="h-3 w-3 mr-1 text-[#F5B8DB]" />
                                        {new Date(entry.date).toLocaleTimeString([], {
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      <span className="truncate">
                                        {entry.content.length > 40 ? entry.content.substring(0, 40) + '...' : entry.content}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="emotions">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h3 className="text-lg font-medium mb-4">Emotions in Your Journal</h3>
              
              {emotions.size === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No emotions have been detected in your journal entries yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from(emotions).map((emotion, i) => (
                    <Badge key={i} className="px-3 py-1 text-sm">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="recycle-bin">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium">Recycle Bin</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Deleted items are automatically removed after 7 days.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {deletedEntries.length} deleted {deletedEntries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              
              {isLoadingDeleted ? (
                <div className="flex justify-center items-center h-64">
                  <div className="pi-thinking-dots">
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                  </div>
                </div>
              ) : deletedEntries.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Recycle Bin is Empty</h3>
                  <p className="text-gray-500 mb-4">
                    Any deleted journal entries will appear here for 7 days before being permanently deleted.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors relative group"
                    >
                      <div className="flex justify-between">
                        <div className="w-full">
                          <h4 className="font-medium text-lg mb-1 text-gray-700">
                            {(() => {
                              // Generate title from content
                              const content = entry.content;
                              if (!content || content.trim() === "") return "Untitled Entry";
                              
                              // Get first sentence or part of it
                              const firstSentence = content.split(/[.!?]/)[0]?.trim();
                              if (!firstSentence) return "Untitled Entry";
                              
                              // If sentence is short enough, use it directly
                              if (firstSentence.length <= 50) {
                                return firstSentence;
                              }
                              
                              // Otherwise, get first 5-7 words
                              const words = firstSentence.split(/\s+/).slice(0, 7);
                              let title = words.join(" ");
                              
                              // Add ellipsis if we truncated
                              if (words.length < firstSentence.split(/\s+/).length) {
                                title += "...";
                              }
                              
                              return title;
                            })()}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              {new Date(entry.date).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                            <div className="flex items-center text-amber-600">
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Deleted
                            </div>
                          </div>
                          <p className="text-gray-600 line-clamp-2 mb-4">{entry.content}</p>
                        </div>
                      </div>
                      
                      <div className="flex mt-4 justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300"
                          onClick={() => restoreMutation.mutate(entry.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-2" />
                          Restore
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline"
                              size="sm" 
                              className="text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300"
                            >
                              <Trash className="h-3.5 w-3.5 mr-2" />
                              Delete Permanently
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Permanently delete entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your journal entry and remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => permanentDeleteMutation.mutate(entry.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}