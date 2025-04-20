import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Prompt } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { LightbulbIcon, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";

type JournalPromptsProps = {
  userId: number;
  onSelectPrompt: (prompt: string) => void;
};

export function JournalPrompts({ userId, onSelectPrompt }: JournalPromptsProps) {
  const [promptsOffset, setPromptsOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Use a random seed to force refresh of prompts
  const [promptsSeed, setPromptsSeed] = useState(Date.now());
  
  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts", promptsSeed],
  });
  
  // Create a handler that bypasses the home page logic
  const handlePromptClick = (promptText: string) => {
    console.log("Direct handling of multi-part prompt:", promptText);
    
    // Manually add the prompt to a chat message using the JournalChat component
    
    // 1. Switch to the chat tab
    const chatTab = document.querySelector('button[value="chat"]') as HTMLButtonElement;
    if (chatTab) {
      chatTab.click();
    }
    
    // 2. Wait a moment for the tab to switch
    setTimeout(() => {
      // 3. Create a user message element
      const chatContainer = document.querySelector('.chat-messages .flex-col');
      if (chatContainer) {
        // Create a user message element
        const userMessage = document.createElement('div');
        userMessage.className = "max-w-[85%] px-4 py-3 journal-entry journal-entry-user self-end";
        userMessage.innerHTML = `<p class="whitespace-pre-line text-[15px]">I'd like to reflect on: ${promptText}</p>`;
        chatContainer.appendChild(userMessage);
        
        // Make the direct API call
        fetch('/api/chat-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            content: `__MULTI_PART_PROMPT__: ${promptText}`,
            userId: userId,
            history: [] 
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log("Got response from API:", data);
          
          // Add the AI response
          const aiMessage = document.createElement('div');
          aiMessage.className = "max-w-[85%] px-4 py-3 journal-entry journal-entry-ai self-start";
          aiMessage.innerHTML = `<p class="whitespace-pre-line text-[15px]">${data.content}</p>`;
          chatContainer.appendChild(aiMessage);
          
          // Scroll to the bottom
          const chatMessagesContainer = document.querySelector('.chat-messages');
          if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
          }
          
          // Focus the input box
          setTimeout(() => {
            const inputElement = document.querySelector('input[placeholder="Write your thoughts or ask a question..."]') as HTMLInputElement;
            if (inputElement) {
              inputElement.focus();
            }
          }, 100);
        })
        .catch(error => {
          console.error("Error sending multi-part prompt:", error);
          alert("There was an error processing your prompt. Please try again.");
        });
      } else {
        // Fallback to the original method
        onSelectPrompt(`__MULTI_PART_PROMPT__: ${promptText}`);
      }
    }, 200);
  };
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Journal Prompts</h2>
          <p className="text-sm text-gray-500">Inspiration for reflection</p>
        </div>
        <div className="bg-[#F5D867]/10 p-2 rounded-full">
          <LightbulbIcon className="h-5 w-5 text-[#F5D867]" />
        </div>
      </div>
      
      <div className="space-y-3 my-4">
        {isLoading ? (
          <>
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
          </>
        ) : prompts.length === 0 ? (
          <div className="text-center p-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#F5D867]/10 flex items-center justify-center mb-4">
              <LightbulbIcon className="h-8 w-8 text-[#F5D867]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Prompts</h3>
            <p className="text-gray-600">
              No prompts available at the moment.
            </p>
          </div>
        ) : (
          prompts.slice(promptsOffset, promptsOffset + 3).map((prompt) => (
            <div 
              key={prompt.id}
              className={`p-4 bg-[#F5D867]/10 hover:bg-[#F5D867]/20 rounded-2xl cursor-pointer transition-colors border border-[#F5D867]/20 ${isRefreshing ? 'opacity-50' : ''}`}
              onClick={() => handlePromptClick(prompt.text)}
            >
              <p className="text-gray-800">{prompt.text}</p>
            </div>
          ))
        )}
      </div>
      
      <button 
        onClick={() => {
          setIsRefreshing(true);
          
          // Set a new seed value to force a refresh of prompts
          setPromptsSeed(Date.now());
          
          // Reset offset to 0
          setPromptsOffset(0);
          
          // Add a short delay to make the refresh animation visible
          setTimeout(() => {
            setIsRefreshing(false);
          }, 800);
        }} 
        className="w-full py-3 text-primary font-medium flex items-center justify-center hover:underline"
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Refreshing...
          </>
        ) : (
          <>
            Get More Prompts <ChevronRight className="h-4 w-4 ml-1" />
          </>
        )}
      </button>
    </div>
  );
}
