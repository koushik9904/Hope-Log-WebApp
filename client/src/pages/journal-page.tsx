import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { JournalEntry } from "@shared/schema";
import { 
  Calendar, 
  ChevronDown, 
  Filter, 
  MessageSquare, 
  Search, 
  SortAsc, 
  SortDesc,
  Plus,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JournalPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "user" | "ai">("all");
  const [activeTab, setActiveTab] = useState<string>("entries");
  
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
    <div className="container mx-auto p-6 max-w-6xl">
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
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        <h3 className="font-medium">{date}</h3>
                      </div>
                      <Badge variant="outline">{dateEntries.length} entries</Badge>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {dateEntries.map((entry) => (
                      <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <Link href={`/journal/${entry.id}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className={`text-sm font-medium flex items-center ${entry.isAiResponse ? "text-blue-600" : "text-gray-700"}`}>
                              {entry.isAiResponse ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                    <span className="text-xs font-bold text-blue-600">H</span>
                                  </div>
                                  Hope Log
                                </>
                              ) : (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                                    <span className="text-xs font-bold text-gray-600">
                                      {user?.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  You
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <p className="text-gray-700 line-clamp-2 mb-3">{entry.content}</p>
                          
                          {entry.sentiment && entry.sentiment.emotions.length > 0 && (
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
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center py-16">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Calendar View Coming Soon</h3>
            <p className="text-gray-500 mb-4">
              The calendar view is under development and will be available soon.
            </p>
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
  );
}