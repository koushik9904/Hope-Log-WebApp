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
    
    // Make a direct API call for the multi-part prompt
    fetch('/api/chat-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        content: prompt, // This already has the __MULTI_PART_PROMPT__ prefix
        userId: user?.id,
        history: [] 
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Got response from API:", data);
      
      // Force reload the page to see the new message in chat
      window.location.href = "/?refresh=" + new Date().getTime();
    })
    .catch(error => {
      console.error("Error sending multi-part prompt:", error);
      alert("There was an error processing your prompt. Please try again.");
    });
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
