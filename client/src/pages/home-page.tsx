import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { JournalChat } from "@/components/journal/journal-chat";
import { MoodTracker } from "@/components/journal/mood-tracker";
import { WeeklySummary } from "@/components/journal/weekly-summary";
import { GoalsHabits } from "@/components/journal/goals-habits";
import { JournalPrompts } from "@/components/journal/journal-prompts";

export default function HomePage() {
  const { user } = useAuth();
  const [journalInput, setJournalInput] = useState("");
  
  const handleSelectPrompt = (prompt: string) => {
    setJournalInput(prompt);
    
    // Find the journal input and set its value
    const input = document.querySelector('input[placeholder="Continue your journal..."]') as HTMLInputElement;
    if (input) {
      input.value = prompt;
      input.focus();
    }
  };
  
  if (!user) return null;
  
  return (
    <div id="app" className="flex flex-col min-h-screen bg-neutral-lightest">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow md:ml-64 pb-16 md:pb-0">
        <DashboardHeader user={user} />
        
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <JournalChat userId={user.id} />
              <MoodTracker userId={user.id} />
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <WeeklySummary userId={user.id} />
              <GoalsHabits userId={user.id} />
              <JournalPrompts userId={user.id} onSelectPrompt={handleSelectPrompt} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
