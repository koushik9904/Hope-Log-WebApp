import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileEdit } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export function GenerateTitlesButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  
  // This button should only be visible to admins
  if (!user?.isAdmin) return null;
  
  const handleGenerateTitles = async () => {
    try {
      setIsGenerating(true);
      
      // Call the API endpoint to generate titles
      const response = await apiRequest("POST", "/api/admin/generate-journal-titles");
      const result = await response.json();
      
      // Show success toast
      toast({
        title: "Title Generation Complete",
        description: `Generated ${result.stats.generated} titles. ${result.stats.skipped} entries already had titles. ${result.stats.failed} failed.`,
        variant: "default"
      });
      
      // Refresh journal entries 
      queryClient.invalidateQueries({ queryKey: [`/api/journal-entries/${user.id}`] });
    } catch (error) {
      console.error("Error generating titles:", error);
      
      toast({
        title: "Error",
        description: "Failed to generate titles for journal entries. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateTitles}
      disabled={isGenerating}
      className="mt-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating titles...
        </>
      ) : (
        <>
          <FileEdit className="mr-2 h-4 w-4" />
          Generate titles for entries
        </>
      )}
    </Button>
  );
}