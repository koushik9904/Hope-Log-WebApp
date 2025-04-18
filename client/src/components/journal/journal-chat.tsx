import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, JournalEntry } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageSquare, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

type JournalChatProps = {
  userId: number;
};

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

  return (
    <div className="rosebud-card">
      <div className="rosebud-card-header">
        <div>
          <h2 className="rosebud-card-title">Today's Journal</h2>
          <p className="rosebud-card-subtitle">Share your thoughts with Hope AI</p>
        </div>
        <div className="bg-primary/10 p-2 rounded-full">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="h-96 flex flex-col space-y-3 overflow-y-auto pr-2"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Start Journaling</h3>
            <p className="text-gray-600 max-w-md">
              Your AI companion is here to listen. Share your thoughts or choose a prompt below to begin.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id}
              className={cn(
                "max-w-[85%] px-5 py-4 rounded-2xl journal-entry",
                entry.isAiResponse 
                  ? "journal-entry-ai self-start"
                  : "journal-entry-user self-end"
              )}
            >
              <p className="whitespace-pre-line text-[15px]">{entry.content}</p>
            </div>
          ))
        )}
        
        {addEntryMutation.isPending && (
          <div className="max-w-[85%] px-5 py-4 rounded-2xl journal-entry journal-entry-ai self-start animate-pulse">
            <p className="text-[15px]">Thinking...</p>
          </div>
        )}
      </div>
      
      <div className="mt-5">
        <form className="flex items-center w-full gap-3" onSubmit={handleSubmit}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rosebud-input flex-grow"
            placeholder="Continue your journal..."
            disabled={addEntryMutation.isPending}
          />
          <Button
            type="submit"
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-primary hover:bg-primary/90"
            disabled={addEntryMutation.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
