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
      
      // Wait a moment for the tab to switch
      setTimeout(() => {
        // Find the input field and submit button
        const input = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
        const submitButton = input?.closest('form')?.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (input && submitButton) {
          // Set the input value to our prompt (which may already be formatted with __MULTI_PART_PROMPT__ prefix)
          input.value = prompt;
          
          // Directly submit the form to send the message to the AI
          const form = input.closest('form');
          if (form) {
            // Create and dispatch a submit event
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          } else {
            // Fallback - click the submit button
            submitButton.click();
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
