import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createTestNotifications } from "@/lib/notification-service";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function CreateTestNotifications() {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTestNotifications = async () => {
    setIsCreating(true);
    try {
      const result = await createTestNotifications();
      if (result) {
        toast({
          title: "Test notifications created",
          description: "Check your notifications bell icon to see the test notifications.",
        });
        
        // Invalidate notifications queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      } else {
        toast({
          title: "Error",
          description: "Could not create test notifications.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating test notifications:", error);
      toast({
        title: "Error",
        description: "Could not create test notifications. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleCreateTestNotifications}
      disabled={isCreating}
      className="flex items-center space-x-1"
    >
      {isCreating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          <span>Creating test notifications...</span>
        </>
      ) : (
        <span>Create Test Notifications</span>
      )}
    </Button>
  );
}