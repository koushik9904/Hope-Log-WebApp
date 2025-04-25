import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, JournalEntry } from "@shared/schema";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Save,
  Plus,
  Download,
  BarChart,
  BarChart2,
  PenLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [journalEntry, setJournalEntry] = useState("");
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch journal entries for the current user
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/journal-entries/${userId}`],
    staleTime: 60000, // 1 minute
  });

  // Local state to store chat messages (not saved to DB until "Save Chat" is clicked)
  const [chatHistory, setChatHistory] = useState<Array<{id: number, isAiResponse: boolean, content: string, date: string}>>([]);
  const [nextId, setNextId] = useState(1);
  
  // Simulate adding a new chat message and get AI response without saving to DB
  const addEntryMutation = useMutation({
    mutationFn: async (content: string) => {
      // Check if it's a one-shot prompt from the suggestions
      const isFromSuggestions = SUGGESTED_PROMPTS.includes(content);
      
      // Check if it's a multi-part prompt
      const isMultiPartPrompt = content.startsWith('__MULTI_PART_PROMPT__:');
      
      // Process content based on type
      let processedContent = content;
      let displayContent = content; // What to show in the chat UI
      
      // Handle special prompt types
      if (isFromSuggestions) {
        // Convert to ASK_ME_ABOUT format to signal the AI to ask questions
        processedContent = `ASK_ME_ABOUT: ${content}`;
        console.log("Reformatted one-shot prompt:", processedContent);
      } 
      else if (isMultiPartPrompt) {
        // For multi-part prompts, extract the actual prompt from the format prefix
        displayContent = content.replace('__MULTI_PART_PROMPT__:', '').trim();
        console.log("Reformatted multi-part prompt. Display:", displayContent, "Process:", processedContent);
        
        // For display purposes, show it as "I'd like to reflect on: [prompt]"
        displayContent = `I'd like to reflect on: ${displayContent}`;
      }
      
      // Set active tab to chat for multi-part prompts (in case we're on journal tab)
      if (isMultiPartPrompt) {
        setActiveTab("chat");
      }
      
      // Add user message to local chat history - using the display content
      const userMessage = {
        id: nextId,
        content: displayContent, // show the display version to the user
        isAiResponse: false,
        date: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      setNextId(prevId => prevId + 1);
      
      // Get AI response through the API - send the processed content to the AI
      const res = await apiRequest("POST", "/api/chat-response", {
        content: processedContent, // send the processed version to the AI
        userId,
        // Send recent chat history for context
        history: chatHistory.slice(-5).map(entry => ({
          role: entry.isAiResponse ? "ai" : "user",
          content: entry.content
        }))
      });
      
      const aiResponse = await res.json();
      
      // Add AI response to local chat history
      setChatHistory(prev => [...prev, {
        id: nextId + 1,
        content: aiResponse.content,
        isAiResponse: true,
        date: new Date().toISOString()
      }]);
      
      setNextId(prevId => prevId + 2);
      
      // Focus the input element after receiving AI response
      setTimeout(() => {
        const inputElement = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
      
      return [userMessage, { id: nextId + 1, content: aiResponse.content, isAiResponse: true, date: new Date().toISOString() }];
    },
    onError: (error) => {
      console.error("Failed to get AI response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI response. Please try again."
      });
    }
  });

  // Save chat as journal entry with sentiment analysis and goal extraction
  const saveChatMutation = useMutation({
    mutationFn: async () => {
      // Create a transcript from the chat history
      const transcript = chatHistory
        .map(entry => `${entry.isAiResponse ? 'Hope Log: ' : 'You: '}${entry.content}`)
        .join('\n\n');
      
      // Create a summary from the chat content - combine all user messages
      const userMessages = chatHistory
        .filter(entry => !entry.isAiResponse)
        .map(entry => entry.content);
      
      // Use the last user message or a summary if multiple messages
      const summaryContent = userMessages.length > 0 
        ? userMessages.length === 1 
            ? userMessages[0] 
            : userMessages.join('\n\n')
        : "Journal entry from chat";
      
      // Get user's local date
      const localDate = new Date();
      
      // Use the regular journal entry endpoint but specify this is a journal entry (not chat)
      const res = await apiRequest("POST", "/api/journal-entries", {
        userId,
        content: summaryContent,
        transcript: transcript,
        isJournal: true,
        date: localDate.toISOString()
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Get the entry ID from the response
      const entryId = data && data.length > 0 ? data[0].id : null;
      
      // Show successful save message with view option
      toast({
        title: "Chat saved",
        description: (
          <div>
            <p>Your chat has been saved as a journal entry with sentiment analysis</p>
            {entryId && (
              <p className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                  className="mt-1 bg-white"
                >
                  <Link to={`/journal/${entryId}`}>
                    View Journal Entry
                  </Link>
                </Button>
              </p>
            )}
          </div>
        )
      });
      
      // Clear chat history after saving
      setChatHistory([]);
      // Refresh journal entries list
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${userId}`] });
    },
    onError: (error) => {
      console.error("Failed to save chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save chat. Please try again."
      });
    }
  });

  // Save long-form journal entry
  const saveJournalEntryMutation = useMutation({
    mutationFn: async (content: string) => {
      // Get user's local date
      const localDate = new Date();
      
      const res = await apiRequest("POST", "/api/journal-entries", {
        content,
        userId,
        isJournal: true,
        analyzeSentiment: true,
        date: localDate.toISOString()
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Get the entry ID from the response
      const entryId = data && data.length > 0 ? data[0].id : null;
      
      toast({
        title: "Journal entry saved",
        description: (
          <div>
            <p>Your journal entry has been saved with sentiment analysis</p>
            {entryId && (
              <p className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                  className="mt-1 bg-white"
                >
                  <Link to={`/journal/${entryId}`}>
                    View Journal Entry
                  </Link>
                </Button>
              </p>
            )}
          </div>
        )
      });
      setJournalEntry("");
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

  // Filter entries based on search term and isJournal property
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter out chat-based entries when in journal mode
    // Consider any entry with a journal property as journal-type entry, otherwise treat all as non-journal entries
    return matchesSearch && ((entry as any).isJournal === undefined || !(entry as any).isJournal);
  });

  // Check URL query parameters to trigger a multi-part prompt
  useEffect(() => {
    // This adds support for direct prompting via URL refresh
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('refresh') && chatHistory.length === 0) {
      // This is a refresh triggered by a selected prompt
      // Check localStorage for a stored prompt
      const savedPrompt = localStorage.getItem('selected_prompt');
      if (savedPrompt) {
        // Clear it immediately to prevent multiple executions
        localStorage.removeItem('selected_prompt');
        
        // Process the prompt
        console.log("Executing stored prompt from localStorage:", savedPrompt);
        setTimeout(() => {
          addEntryMutation.mutate(savedPrompt);
        }, 500); // Small delay to let the UI render first
      }
    }
  }, []);

  // Scroll to bottom of chat when entries change
  useEffect(() => {
    if (chatContainerRef.current && activeTab === "chat") {
      // Scroll to the bottom
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [entries, activeTab, chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      addEntryMutation.mutate(message);
      setMessage("");
      
      // Focus back on the input after submission
      setTimeout(() => {
        const inputElement = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
    }
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (journalEntry.trim()) {
      saveJournalEntryMutation.mutate(journalEntry);
    }
  };

  // Instead of copying the prompt to the input field, directly trigger an AI response
  const handleSuggestedPrompt = (prompt: string) => {
    // Add the special prefix to indicate this is a prompt that should be asked TO the user
    const prefixedPrompt = `ASK_ME_ABOUT: ${prompt}`;
    
    // Don't set the message state, just directly send the prompt to the AI
    addEntryMutation.mutate(prefixedPrompt);
    
    // Log to confirm this method is being called
    console.log("Direct AI prompt:", prompt);
    
    // Focus the input after clicking a suggested prompt
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const handleSaveChat = () => {
    if (chatHistory.length > 0) {        
      // Save the combined chat as a single journal entry
      saveChatMutation.mutate();
    } else {
      toast({
        title: "No entries to save",
        description: "Start a conversation before saving",
        variant: "destructive"
      });
    }
  };

  // Reversing the chat display order to show latest messages at the bottom near the input
  const displayEntries = getReversedEntries();

  return (
    <div className="pi-card bg-[#FFF8E8] border border-gray-200">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="pi-card-header flex justify-between items-center bg-[#9AAB63] rounded-t-xl border-b border-[#9AAB63]/50 -mx-6 -mt-6 p-4 mb-6">
          <div></div>
          <TabsList className="px-1">
            <TabsTrigger value="chat" className="px-3 py-1.5">Chat</TabsTrigger>
            <TabsTrigger value="journal" className="px-3 py-1.5">Journal</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="mt-0 space-y-4 flex flex-col h-full">
          <div className="chat-container flex-grow flex flex-col">
            {/* Sentiment Analysis Summary (when requested) */}
            {showSummary && (
            <div className="bg-white rounded-lg p-4 border border-[#F5B8DB]/20 mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <BarChart className="h-4 w-4 mr-1.5 text-[#F5B8DB]" />
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
                  <p className="text-gray-700">
                    {analyzeEntriesMutation.data?.summary || 
                      "You've been showing mixed emotions in your recent journal entries, with some anxiety but also moments of joy."}
                  </p>
                  
                  <div>
                    <div className="font-medium text-gray-800 mb-1 flex items-center">
                      <Heart className="h-3.5 w-3.5 mr-1 text-[#F5B8DB]" /> 
                      Primary Emotions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(analyzeEntriesMutation.data?.emotions || ["Anxiety", "Joy", "Hope"]).map((emotion, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#F5B8DB]/10 rounded-full text-xs border border-[#F5B8DB]/20 text-gray-700">
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-800 mb-1">Common Themes</div>
                    <div className="flex flex-wrap gap-1">
                      {(analyzeEntriesMutation.data?.themes || ["Work", "Relationships"]).map((theme, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#B6CAEB]/10 rounded-full text-xs border border-[#B6CAEB]/20 text-gray-700">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-1">
                    <Link to="/insights" className="text-[#9AAB63] text-xs font-medium flex items-center hover:text-[#F5B8DB]">
                      <BarChart className="h-3 w-3 mr-1" /> View full report
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div 
            ref={chatContainerRef}
            className="chat-messages h-80 px-2 mb-3"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="pi-thinking-dots">
                  <div className="pi-thinking-dot"></div>
                  <div className="pi-thinking-dot"></div>
                  <div className="pi-thinking-dot"></div>
                </div>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-20 h-20 rounded-full bg-[#F5B8DB]/10 flex items-center justify-center mb-4">
                  <Sparkle className="h-8 w-8 text-[#F5B8DB]" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Start Journaling</h3>
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
                {/* Chat container to display messages in order */}
                <div className="flex flex-col space-y-3">
                  {/* Display chat messages from local state */}
                  {chatHistory.map((entry) => (
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
                </div>
                
                {/* Pi.ai style suggestions after AI responses - show only after most recent message is from AI */}
                {chatHistory.length > 0 && chatHistory[chatHistory.length - 1].isAiResponse && (
                  <div className="pi-suggestions self-start ml-2 mt-1">
                    <button 
                      className="pi-suggestion-chip flex items-center"
                      onClick={() => {
                        setMessage("Tell me more about what you just said");
                        addEntryMutation.mutate("Tell me more about what you just said");
                        setMessage("");
                        
                        // Focus back on the input after clicking a suggestion
                        setTimeout(() => {
                          const inputElement = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
                          if (inputElement) {
                            inputElement.focus();
                          }
                        }, 100);
                      }}
                    >
                      Tell me more <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                    <button 
                      className="pi-suggestion-chip flex items-center"
                      onClick={() => {
                        setMessage("Why might I feel this way?");
                        addEntryMutation.mutate("Why might I feel this way?");
                        setMessage("");
                        
                        // Focus back on the input after clicking a suggestion
                        setTimeout(() => {
                          const inputElement = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
                          if (inputElement) {
                            inputElement.focus();
                          }
                        }, 100);
                      }}
                    >
                      Why do I feel this way? <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                )}
                
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
              </>
            )}
          </div>
          
          <div className="flex justify-end items-center text-xs text-gray-600 px-1">
            <button 
              className="hover:text-[#F5B8DB] flex items-center"
              onClick={() => {
                // Clear the chat history and start a new chat
                setChatHistory([]);
                toast({
                  title: "New Chat Started",
                  description: "Starting a fresh conversation",
                });
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>New Chat</span>
            </button>
          </div>
          
          <div className="mt-3 flex flex-col gap-3">
            {/* Save Chat button at the bottom */}
            {chatHistory.length > 0 && (
              <div className="w-full flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[#9AAB63] bg-white border-[#9AAB63]/40 hover:bg-[#9AAB63]/10 hover:text-[#9AAB63] mb-1"
                  onClick={handleSaveChat}
                  disabled={saveChatMutation.isPending}
                >
                  {saveChatMutation.isPending ? (
                    <>
                      <span className="mr-1.5">Saving</span>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Save Chat as Journal Entry
                    </>
                  )}
                </Button>
              </div>
            )}
          
            <form className="flex items-center w-full gap-2" onSubmit={handleSubmit}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl px-4 py-2.5 bg-white border border-[#9AAB63]/20 text-gray-800 focus:ring-2 focus:ring-[#9AAB63]/20 focus:border-[#9AAB63]/30 focus:bg-white transition-all placeholder:text-gray-500 flex-grow"
                placeholder="Write your thoughts or ask a question..."
                disabled={addEntryMutation.isPending}
              />
              <button
                type="button"
                className="rounded-full w-10 h-10 flex items-center justify-center bg-[#F5B8DB] hover:bg-[#F5B8DB]/80 transition-all"
                disabled={addEntryMutation.isPending}
                onClick={() => toast({
                  title: "Coming Soon",
                  description: "Voice recording feature will be available in the next update.",
                  variant: "default"
                })}
              >
                <Mic className="h-5 w-5 text-white" />
              </button>
              <button
                type="submit"
                className="rounded-xl py-2.5 px-5 font-medium text-white transition-all bg-[#9AAB63] hover:bg-[#9AAB63]/80"
                disabled={addEntryMutation.isPending || !message.trim()}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
          </div>
        </TabsContent>
        
        <TabsContent value="journal" className="mt-0 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-[#9AAB63]/30">
            <h3 className="font-semibold text-gray-800 flex items-center mb-2">
              <PenLine className="h-4 w-4 mr-1.5 text-[#9AAB63]" />
              Daily Journal
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Write a reflective entry about your day, thoughts, or feelings. Your entry will be saved with AI-generated insights.
            </p>
            
            <form onSubmit={handleJournalSubmit} className="space-y-3">
              <Textarea 
                placeholder="How was your day? What's on your mind?"
                className="min-h-[120px] rounded-xl px-4 py-2.5 bg-white border border-[#9AAB63]/20 text-gray-800 focus:ring-2 focus:ring-[#9AAB63]/20 focus:border-[#9AAB63]/30 focus:bg-white transition-all placeholder:text-gray-500"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                disabled={saveJournalEntryMutation.isPending}
              />
              
              <Button 
                type="submit" 
                className="rounded-xl py-2.5 px-5 font-medium text-white transition-all bg-[#9AAB63] hover:bg-[#9AAB63]/80 w-full"
                disabled={saveJournalEntryMutation.isPending || !journalEntry.trim()}
              >
                {saveJournalEntryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Journal Entry
                  </>
                )}
              </Button>
            </form>
          </div>
          
          <div className="bg-white rounded-lg border border-[#B6CAEB]/30 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Journal Entries</h3>
            
            <div className="divide-y divide-[#B6CAEB]/20 max-h-48 overflow-y-auto pr-2">
              {/* Check if we have any journal entries - either isJournal flag is true or it's a long-form entry */}
              {entries.filter(entry => (entry as any).isJournal === true || (!entry.isAiResponse && entry.content.length > 200)).length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No journal entries yet</p>
                </div>
              ) : (
                entries
                  .filter(entry => (entry as any).isJournal === true || (!entry.isAiResponse && entry.content.length > 200))
                  .map((entry) => (
                    <div key={entry.id} className="py-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-medium text-[#9AAB63]">
                          Journal Entry
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{entry.content}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
