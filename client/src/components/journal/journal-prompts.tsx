import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Prompt } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type JournalPromptsProps = {
  userId: number;
  onSelectPrompt: (prompt: string) => void;
};

export function JournalPrompts({ userId, onSelectPrompt }: JournalPromptsProps) {
  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });
  
  return (
    <div className="bg-white rounded-card shadow-sm">
      <div className="p-4 border-b border-neutral-light">
        <h2 className="text-lg font-semibold font-nunito">Journal Prompts</h2>
        <p className="text-neutral-medium text-sm">Try these to inspire reflection</p>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="w-full h-14" />
              <Skeleton className="w-full h-14" />
              <Skeleton className="w-full h-14" />
            </>
          ) : prompts.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-neutral-medium">
                No prompts available at the moment.
              </p>
            </div>
          ) : (
            prompts.slice(0, 3).map((prompt) => (
              <div 
                key={prompt.id}
                className="p-3 bg-neutral-light bg-opacity-50 rounded-md cursor-pointer hover:bg-opacity-75"
                onClick={() => onSelectPrompt(prompt.text)}
              >
                <p>{prompt.text}</p>
              </div>
            ))
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full py-2 mt-4 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
        >
          Get More Prompts
        </Button>
      </div>
    </div>
  );
}
