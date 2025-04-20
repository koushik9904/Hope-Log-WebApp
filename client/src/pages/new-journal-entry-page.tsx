import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NewJournalEntryPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  
  const createJournalMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to create a journal entry");
      
      const res = await apiRequest("POST", "/api/journal-entries", {
        content,
        userId: user.id,
        isJournal: true // This is a direct journal entry
      });
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal entry created",
        description: "Your journal entry has been saved successfully."
      });
      
      // Invalidate journal entries query to refresh the list
      queryClient.invalidateQueries({
        queryKey: [`/api/journal-entries/${user?.id}`]
      });
      
      // Navigate back to journal list
      navigate("/journal");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create journal entry: ${error.message}`
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some content for your journal entry."
      });
      return;
    }
    
    createJournalMutation.mutate();
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/journal")}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="What's on your mind today?"
                className="min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={createJournalMutation.isPending || !content.trim()}
                >
                  {createJournalMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}