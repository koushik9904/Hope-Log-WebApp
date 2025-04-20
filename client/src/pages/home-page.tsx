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
        try {
          // For multi-part prompts from the Journal Prompts section, we need to use a special approach
          // We'll directly add both the user message and AI response to the chat history
          
          // Step 1: Add the user's selected prompt as a message
          // Find the JournalChat component's input and form
          const chatInput = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
          
          if (chatInput) {
            // Set the input value to our prompt
            chatInput.value = prompt;
            // Find the form and submit button
            const chatForm = chatInput.closest('form');
            if (chatForm) {
              // Directly submit the form using the built-in method
              chatForm.requestSubmit();
            }
          } else {
            console.error("Could not find chat input");
            
            // Fallback: try a direct API approach
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
                console.log("Successfully sent prompt via API fallback");
                // Give the API a moment to process, then reload
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              } else {
                console.error("Failed to send prompt via API fallback");
              }
            })
            .catch(error => {
              console.error("Error in API fallback:", error);
            });
          }
        } catch (error) {
          console.error("Error in handleSelectPrompt:", error);
        }
      }, 200); // Increased timeout to ensure tab switch completes
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
