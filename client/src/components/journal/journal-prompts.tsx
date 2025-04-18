import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Prompt } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { LightbulbIcon } from "lucide-react";

type JournalPromptsProps = {
  userId: number;
  onSelectPrompt: (prompt: string) => void;
};

export function JournalPrompts({ userId, onSelectPrompt }: JournalPromptsProps) {
  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });
  
  return (
    <Card className="journal-container shadow-sm card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <LightbulbIcon className="h-5 w-5 mr-2 text-primary" />
          Journal Prompts
        </CardTitle>
        <CardDescription>
          Try these to inspire reflection
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-16" />
            </>
          ) : prompts.length === 0 ? (
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <LightbulbIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Prompts</h3>
              <p className="text-muted-foreground">
                No prompts available at the moment.
              </p>
            </div>
          ) : (
            prompts.slice(0, 3).map((prompt) => (
              <div 
                key={prompt.id}
                className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors card-hover"
                onClick={() => onSelectPrompt(prompt.text)}
              >
                <p className="text-sm">{prompt.text}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0">
        <Button 
          variant="outline" 
          className="w-full"
        >
          Get More Prompts
        </Button>
      </CardFooter>
    </Card>
  );
}
