import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { JournalChat } from "@/components/journal/journal-chat";
import { MoodTracker } from "@/components/journal/mood-tracker";
import { WeeklySummary } from "@/components/journal/weekly-summary";
import { GoalsHabits } from "@/components/journal/goals-habits";
import { JournalPrompts } from "@/components/journal/journal-prompts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function HomePage() {
  const { user } = useAuth();
  const [journalInput, setJournalInput] = useState("");
  
  // Function to handle when a prompt is selected from the JournalPrompts component
  const handleSelectPrompt = (prompt: string) => {
    console.log("Home page received prompt:", prompt);
    
    // First, click on the chat tab to ensure we're in chat mode
    const chatTab = document.querySelector('button[value="chat"]') as HTMLButtonElement;
    if (chatTab) {
      chatTab.click();
      
      // More direct approach to find the component and simulate input
      // Wait a moment for the tab to switch
      setTimeout(() => {
        try {
          // Get direct access to the chat component's addEntryMutation
          // Since we can't access the component directly, send the prompt directly via the API
          fetch('/api/chat-response', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              content: prompt,
              userId: user?.id,
              history: [] 
            })
          })
          .then(response => {
            if (response.ok) {
              // Since we can't directly update the chat UI, maybe we need to reload
              console.log("Successfully sent prompt via API");
              // Force reload the UI
              window.location.reload();
            } else {
              console.error("Failed to send prompt");
            }
          })
          .catch(error => {
            console.error("Error sending prompt:", error);
          });
        } catch (error) {
          console.error("Error in handleSelectPrompt:", error);
          
          // Fallback to the old method
          const input = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
          if (input) {
            input.value = prompt;
            const form = input.closest('form');
            if (form) {
              form.requestSubmit();
            }
          }
        }
      }, 100);
    }
  };
  
  if (!user) return null;
  
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <JournalChat userId={user.id} />
          <JournalPrompts userId={user.id} onSelectPrompt={handleSelectPrompt} />
          <MoodTracker userId={user.id} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <WeeklySummary userId={user.id} />
          <GoalsHabits userId={user.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
