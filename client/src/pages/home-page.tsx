import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
  const [location] = useLocation();
  
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
  
  const renderContent = () => {
    switch (location) {
      case '/':
        return (
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
        );
      
      case '/journal':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Full journal experience */}
            <div className="lg:col-span-2 space-y-6">
              <JournalChat userId={user.id} />
              <JournalPrompts userId={user.id} onSelectPrompt={handleSelectPrompt} />
            </div>
            
            <div className="space-y-6">
              <MoodTracker userId={user.id} />
              <WeeklySummary userId={user.id} />
            </div>
          </div>
        );
        
      case '/insights':
        return (
          <div className="grid grid-cols-1 gap-6">
            <h2 className="text-2xl font-semibold">Insights</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <WeeklySummary userId={user.id} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <MoodTracker userId={user.id} />
            </div>
          </div>
        );
        
      case '/goals':
        return (
          <div className="grid grid-cols-1 gap-6">
            <h2 className="text-2xl font-semibold">Goals & Habits</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <GoalsHabits userId={user.id} />
            </div>
          </div>
        );
        
      case '/settings':
        return (
          <div className="grid grid-cols-1 gap-6">
            <h2 className="text-2xl font-semibold">Settings</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Account Settings</h3>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary text-xl">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <p className="text-lg font-medium">{user?.username}</p>
                  <p className="text-sm text-gray-500">Standard Plan</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Notification Settings</h4>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" className="rounded text-primary" />
                  <span>Daily reminders</span>
                </label>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" className="rounded text-primary" />
                  <span>Weekly summaries</span>
                </label>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Default to dashboard */}
            <div className="lg:col-span-2 space-y-6">
              <JournalChat userId={user.id} />
              <MoodTracker userId={user.id} />
            </div>
            
            <div className="space-y-6">
              <WeeklySummary userId={user.id} />
              <GoalsHabits userId={user.id} />
              <JournalPrompts userId={user.id} onSelectPrompt={handleSelectPrompt} />
            </div>
          </div>
        );
    }
  };
  
  return (
    <div id="app" className="flex flex-col min-h-screen bg-neutral-lightest">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow md:ml-64 pb-16 md:pb-0">
        <DashboardHeader user={user} />
        
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
