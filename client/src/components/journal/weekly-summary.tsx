import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Summary } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart4, Calendar, Sparkles, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type WeeklySummaryProps = {
  userId: number;
};

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 }); // Sunday
  
  const startDateStr = format(startDate, "MMM d");
  const endDateStr = format(endDate, "MMM d, yyyy");
  
  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: [`/api/summary/${userId}`],
  });
  
  return (
    <Card className="journal-container shadow-sm card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <BarChart4 className="h-5 w-5 mr-2 text-primary" />
          Weekly Summary
        </CardTitle>
        <CardDescription className="flex items-center">
          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
          <span>{startDateStr} - {endDateStr}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-20" />
          </div>
        ) : summary ? (
          <>
            <div className="mb-4 rounded-lg p-3 bg-muted">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Top Emotions
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.topEmotions.map((emotion, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/5 text-primary-foreground">{emotion}</Badge>
                ))}
              </div>
            </div>
            
            <div className="mb-4 rounded-lg p-3 bg-muted">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-primary" />
                Common Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.commonThemes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/5 text-primary-foreground">{theme}</Badge>
                ))}
              </div>
            </div>
            
            <div className="mb-4 rounded-lg p-3 bg-muted">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Insights
              </h3>
              <p className="text-sm text-muted-foreground">{summary.insights}</p>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart4 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Summary Yet</h3>
            <p className="text-muted-foreground">
              Complete more journal entries to receive your weekly insights.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0">
        <Button 
          variant="outline" 
          className="w-full"
        >
          View Full Report
        </Button>
      </CardFooter>
    </Card>
  );
}
