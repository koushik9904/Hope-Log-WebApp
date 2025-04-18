import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, JournalEntry } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

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
    <Card className="journal-container shadow-sm card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-primary" />
          Today's Journal
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div 
          ref={chatContainerRef}
          className="h-96 flex flex-col space-y-2 overflow-y-auto scrollbar-thin"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start Journaling</h3>
              <p className="text-muted-foreground max-w-md">
                Your AI companion is here to listen. Share your thoughts or choose a prompt to begin.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div 
                key={entry.id}
                className={cn(
                  "max-w-[85%] px-4 py-3 rounded-2xl journal-entry",
                  entry.isAiResponse 
                    ? "journal-entry-ai self-start"
                    : "journal-entry-user self-end"
                )}
              >
                <p className="whitespace-pre-line">{entry.content}</p>
              </div>
            ))
          )}
          
          {addEntryMutation.isPending && (
            <div className="max-w-[85%] px-4 py-3 rounded-2xl journal-entry journal-entry-ai self-start animate-pulse">
              <p>Thinking...</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-2">
        <form className="flex items-center w-full gap-2" onSubmit={handleSubmit}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow rounded-full bg-muted/50 border-0"
            placeholder="Continue your journal..."
            disabled={addEntryMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full w-10 h-10"
            disabled={addEntryMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
