import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, JournalEntry } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageSquare, Sparkle, Mic, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Scroll to bottom of chat when entries change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [entries]);

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

  return (
    <div className="pi-card">
      <div className="pi-card-header">
        <div className="flex items-center">
          <div className="app-logo-icon">
            <span className="text-sm font-bold">H</span>
          </div>
          <div>
            <h2 className="pi-card-title">HopeLog AI</h2>
            <p className="pi-card-subtitle">Your personal journal assistant</p>
          </div>
        </div>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="h-96 flex flex-col space-y-3 overflow-y-auto pr-2"
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
            {entries.map((entry) => (
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
            
            {/* Pi.ai style suggestions after AI responses */}
            {entries.length > 0 && entries[entries.length - 1].isAiResponse && (
              <div className="pi-suggestions self-start ml-2">
                <button className="pi-suggestion-chip flex items-center">
                  Tell me more <ChevronRight className="h-3 w-3 ml-1" />
                </button>
                <button className="pi-suggestion-chip flex items-center">
                  Why do I feel this way? <ChevronRight className="h-3 w-3 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
        
        {addEntryMutation.isPending && (
          <div className="max-w-[85%] px-4 py-3 journal-entry journal-entry-ai self-start">
            <div className="pi-thinking-dots">
              <div className="pi-thinking-dot"></div>
              <div className="pi-thinking-dot"></div>
              <div className="pi-thinking-dot"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-5">
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
    </div>
  );
}
