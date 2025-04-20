import { useQuery } from "@tanstack/react-query";
import { Prompt } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { LightbulbIcon, ChevronRight } from "lucide-react";

type JournalPromptsProps = {
  userId: number;
  onSelectPrompt: (prompt: string) => void;
};

export function JournalPrompts({ userId, onSelectPrompt }: JournalPromptsProps) {
  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });
  
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
          prompts.slice(0, 3).map((prompt) => (
            <div 
              key={prompt.id}
              className="p-4 bg-[#F5D867]/10 hover:bg-[#F5D867]/20 rounded-2xl cursor-pointer transition-colors border border-[#F5D867]/20"
              onClick={() => {
                console.log("Multi-part prompt selected:", prompt.text);
                // Use the special format to indicate this is a multi-part prompt
                onSelectPrompt(`__MULTI_PART_PROMPT__: ${prompt.text}`);
              }}
            >
              <p className="text-gray-800">{prompt.text}</p>
            </div>
          ))
        )}
      </div>
      
      <button className="w-full py-3 text-primary font-medium flex items-center justify-center">
        Get More Prompts <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  );
}
