import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, JournalEntry } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
    <div className="bg-white rounded-card shadow-sm">
      <div className="p-4 border-b border-neutral-light flex justify-between items-center">
        <h2 className="text-lg font-semibold font-nunito">Today's Journal</h2>
        <button className="text-neutral-medium hover:text-primary">
          <i className="ri-more-2-fill"></i>
        </button>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="p-4 h-96 flex flex-col overflow-y-auto hide-scrollbar"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-4">
              <i className="ri-chat-smile-line text-primary text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-neutral-dark mb-2">Start Journaling</h3>
            <p className="text-neutral-medium max-w-md">
              Your AI companion is here to listen. Share your thoughts or choose a prompt to begin.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id}
              className={cn(
                "journal-bubble max-w-[85%] mb-4 px-4 py-3 rounded-[18px]",
                entry.isAiResponse 
                  ? "bg-primary text-white rounded-bl-[4px] self-start"
                  : "bg-neutral-light rounded-br-[4px] self-end"
              )}
            >
              <p>{entry.content}</p>
            </div>
          ))
        )}
        
        {addEntryMutation.isPending && (
          <div className="journal-bubble max-w-[85%] mb-4 px-4 py-3 rounded-[18px] bg-primary text-white rounded-bl-[4px] self-start animate-pulse">
            <p>Thinking...</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-neutral-light">
        <form className="flex items-center" onSubmit={handleSubmit}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow p-3 bg-neutral-light bg-opacity-50 rounded-l-full border-0 focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Continue your journal..."
            disabled={addEntryMutation.isPending}
          />
          <Button
            type="submit"
            className="bg-primary text-white p-3 rounded-r-full focus:outline-none hover:bg-primary-dark"
            disabled={addEntryMutation.isPending}
          >
            <i className="ri-send-plane-fill"></i>
          </Button>
        </form>
      </div>
    </div>
  );
}
