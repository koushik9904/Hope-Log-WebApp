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
    <div className="rosebud-card">
      <div className="rosebud-card-header">
        <div>
          <h2 className="rosebud-card-title">Journal Prompts</h2>
          <p className="rosebud-card-subtitle">Inspiration for reflection</p>
        </div>
        <div className="bg-amber-100 p-2 rounded-full">
          <LightbulbIcon className="h-5 w-5 text-amber-600" />
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
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <LightbulbIcon className="h-8 w-8 text-amber-600" />
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
              className="p-4 bg-amber-50 hover:bg-amber-100 rounded-2xl cursor-pointer transition-colors border border-amber-100/60"
              onClick={() => onSelectPrompt(prompt.text)}
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
