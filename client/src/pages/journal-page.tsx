import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { JournalEntry } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Calendar,
  MessageSquare,
  Search,
  Filter,
  SortDesc,
  SortAsc,
  Plus,
  BookOpen,
  Clock
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

export default function JournalPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "user" | "ai">("all");
  const [activeTab, setActiveTab] = useState<string>("entries");


  
  if (!user) return null;
  
  // Fetch all journal entries
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
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
    const date = new Date(entry.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
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
            <Link href="/journal/new">
              <Button className="pi-button flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Entry
              </Button>
            </Link>
            
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
          </TabsList>
          
          <TabsContent value="entries">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9"
                  placeholder="Search journal entries..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2 self-end">
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
                <Link href="/journal/new">
                  <Button className="pi-button">Start Journaling</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(entriesByDate).map(([date, dateEntries]) => (
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
                        <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}