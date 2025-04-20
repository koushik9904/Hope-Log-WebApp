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
  
  // This function now sends a specific message to the AI that will trigger a few-shot prompt flow
  const handleSelectPrompt = (prompt: string) => {
    // Find the journal chat component
    const journalChat = document.querySelector('.pi-card form input') as HTMLInputElement;
    
    // Create a special formatted message that tells the AI this is a multi-part prompt
    const formattedPrompt = `__MULTI_PART_PROMPT__: ${prompt}`;
    
    // Instead of just setting the value, find a way to programmatically send this to the journal chat
    // This will be picked up in the server route to handle specially
    
    // Find the form and get access to the addEntryMutation function inside JournalChat component
    // For now, we'll simulate clicking on the chat tab first
    const chatTab = document.querySelector('button[value="chat"]') as HTMLButtonElement;
    if (chatTab) {
      chatTab.click();
      
      // Wait a moment for the tab to switch
      setTimeout(() => {
        // Now find the journal input and submit button
        const input = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
        const submitButton = input?.closest('form')?.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (input && submitButton) {
          // Set the input value to our special formatted prompt
          input.value = formattedPrompt;
          
          // Trigger a click on the send button to simulate user sending the message
          submitButton.click();
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
