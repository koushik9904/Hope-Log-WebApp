import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, JournalEntry } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Send, 
  MessageSquare, 
  Sparkle, 
  Mic, 
  ChevronRight, 
  Search,
  FileText,
  Heart,
  Share2,
  Plus,
  Download,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type JournalChatProps = {
  userId: number;
};

// Sample suggested prompts that Pi.ai might offer
const SUGGESTED_PROMPTS = [
  "How am I feeling today?",
  "What's something I'm grateful for?",
  "What's on my mind right now?",
  "What made me smile today?"
];

export function JournalChat({ userId }: JournalChatProps) {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch journal entries for the current user
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${userId}`],
    staleTime: 60000, // 1 minute
  });

  // Add new journal entry and get AI response
  const addEntryMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/journal-entries", {
        content,
        userId
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${userId}`] });
    },
  });

  // Generate sentiment analysis for the journal entries
  const analyzeEntriesMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call a backend API
      // to analyze the journal entries
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        summary: "You've been showing signs of anxiety about work-related matters, but also expressing gratitude for your supportive friends. There's a pattern of stress building up during weekdays and relief on weekends.",
        emotions: ["Anxiety", "Gratitude", "Stress", "Relief"],
        themes: ["Work-life balance", "Relationships", "Self-care"],
        suggestions: ["Consider setting boundaries at work", "Continue practicing gratitude", "Explore stress reduction techniques"]
      };
    },
  });

  // Helper to get entries in reverse order (newest first)
  const getReversedEntries = () => {
    return [...entries].reverse();
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => 
    entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll to bottom of chat when entries change
  useEffect(() => {
    if (chatContainerRef.current && activeTab === "chat") {
      // A slight delay to ensure the DOM has updated
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [entries, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      addEntryMutation.mutate(message);
      setMessage("");
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  // Function to handle analyzing the conversation
  const handleAnalyzeConversation = () => {
    setShowSummary(true);
    analyzeEntriesMutation.mutate();
  };

  // Reversing the chat display order to show latest messages at the bottom near the input
  const displayEntries = getReversedEntries();

  return (
    <div className="pi-card">
      <div className="pi-card-header flex justify-between">
        <HopeLogLogo size="md" />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="px-1">
            <TabsTrigger value="chat" className="px-3 py-1.5">Chat</TabsTrigger>
            <TabsTrigger value="archive" className="px-3 py-1.5">Archive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="chat" className="mt-0 space-y-4">
        {/* Sentiment Analysis Summary (when requested) */}
        {showSummary && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <BarChart className="h-4 w-4 mr-1.5 text-blue-600" />
                Conversation Analysis
              </h3>
              <button 
                onClick={() => setShowSummary(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            
            {analyzeEntriesMutation.isPending ? (
              <div className="py-2 flex justify-center">
                <div className="pi-thinking-dots">
                  <div className="pi-thinking-dot"></div>
                  <div className="pi-thinking-dot"></div>
                  <div className="pi-thinking-dot"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">
                  {analyzeEntriesMutation.data?.summary || 
                    "You've been showing mixed emotions in your recent journal entries, with some anxiety but also moments of joy."}
                </p>
                
                <div>
                  <div className="font-medium text-gray-700 mb-1 flex items-center">
                    <Heart className="h-3.5 w-3.5 mr-1 text-rose-500" /> 
                    Primary Emotions
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(analyzeEntriesMutation.data?.emotions || ["Anxiety", "Joy", "Hope"]).map((emotion, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white rounded-full text-xs border border-gray-200">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-700 mb-1">Common Themes</div>
                  <div className="flex flex-wrap gap-1">
                    {(analyzeEntriesMutation.data?.themes || ["Work", "Relationships"]).map((theme, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white rounded-full text-xs border border-gray-200">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="pt-1">
                  <button className="text-blue-600 text-xs font-medium flex items-center">
                    <Download className="h-3 w-3 mr-1" /> Download full analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div 
          ref={chatContainerRef}
          className="h-80 flex flex-col-reverse space-y-reverse space-y-3 overflow-y-auto pr-2"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="pi-thinking-dots">
                <div className="pi-thinking-dot"></div>
                <div className="pi-thinking-dot"></div>
                <div className="pi-thinking-dot"></div>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Sparkle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Start Journaling</h3>
              <p className="text-gray-600 max-w-md mb-6">
                Your AI companion is here to listen. Share your thoughts or choose a suggestion below.
              </p>
              
              <div className="pi-suggestions">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button 
                    key={index} 
                    className="pi-suggestion-chip"
                    onClick={() => handleSuggestedPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Display when AI is thinking */}
              {addEntryMutation.isPending && (
                <div className="max-w-[85%] px-4 py-3 journal-entry journal-entry-ai self-start">
                  <div className="pi-thinking-dots">
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                    <div className="pi-thinking-dot"></div>
                  </div>
                </div>
              )}
              
              {/* Pi.ai style suggestions after AI responses */}
              {entries.length > 0 && displayEntries[0]?.isAiResponse && (
                <div className="pi-suggestions self-start ml-2 mb-3">
                  <button className="pi-suggestion-chip flex items-center">
                    Tell me more <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                  <button className="pi-suggestion-chip flex items-center">
                    Why do I feel this way? <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              )}
            
              {/* Chat messages - now in reverse order for newest at bottom */}
              {displayEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={cn(
                    "max-w-[85%] px-4 py-3 journal-entry",
                    entry.isAiResponse 
                      ? "journal-entry-ai self-start"
                      : "journal-entry-user self-end"
                  )}
                >
                  <p className="whitespace-pre-line text-[15px]">{entry.content}</p>
                </div>
              ))}
            </>
          )}
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
          <div className="flex space-x-2">
            <button 
              onClick={handleAnalyzeConversation}
              className="hover:text-blue-600 flex items-center"
            >
              <BarChart className="h-3.5 w-3.5 mr-1" />
              <span>Analyze</span>
            </button>
            <button className="hover:text-blue-600 flex items-center">
              <Share2 className="h-3.5 w-3.5 mr-1" />
              <span>Share</span>
            </button>
          </div>
          
          <button className="hover:text-blue-600 flex items-center">
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="mt-3">
          <form className="flex items-center w-full gap-2" onSubmit={handleSubmit}>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pi-input flex-grow"
              placeholder="Write your thoughts or ask a question..."
              disabled={addEntryMutation.isPending}
            />
            <button
              type="button"
              className="voice-button"
              disabled={addEntryMutation.isPending}
            >
              <Mic className="h-5 w-5 text-white" />
            </button>
            <button
              type="submit"
              className="pi-button"
              disabled={addEntryMutation.isPending || !message.trim()}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </TabsContent>
      
      <TabsContent value="archive" className="mt-0">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="pi-input pl-9"
              placeholder="Search your journal entries..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-2">
          {filteredEntries.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No journal entries found</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="py-3">
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-xs font-medium ${entry.isAiResponse ? "text-blue-600" : "text-gray-500"}`}>
                    {entry.isAiResponse ? "Hope Log" : "You"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </TabsContent>
    </div>
  );
}
