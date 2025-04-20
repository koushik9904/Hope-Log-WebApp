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
  
  const handleSelectPrompt = (prompt: string) => {
    setJournalInput(prompt);
    
    // Find the journal input and set its value
    const input = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
    if (input) {
      input.value = prompt;
      input.focus();
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
