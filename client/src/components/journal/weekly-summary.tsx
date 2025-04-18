import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Summary } from "@shared/schema";

type WeeklySummaryProps = {
  userId: number;
};

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 }); // Sunday
  
  const startDateStr = format(startDate, "MMM d");
  const endDateStr = format(endDate, "MMM d, yyyy");
  
  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["/api/summary", userId],
  });
  
  return (
    <div className="bg-white rounded-card shadow-sm">
      <div className="p-4 border-b border-neutral-light">
        <h2 className="text-lg font-semibold font-nunito">Weekly Summary</h2>
        <p className="text-neutral-medium text-sm">{startDateStr} - {endDateStr}</p>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-20" />
          </div>
        ) : summary ? (
          <>
            <div className="mb-4 p-3 bg-primary bg-opacity-5 rounded-md">
              <p className="text-neutral-dark">
                <span className="font-medium">Top emotions:</span> {summary.topEmotions.join(", ")}
              </p>
            </div>
            
            <div className="mb-4 p-3 bg-primary bg-opacity-5 rounded-md">
              <p className="text-neutral-dark">
                <span className="font-medium">Common themes:</span> {summary.commonThemes.join(", ")}
              </p>
            </div>
            
            <div className="mb-4 p-3 bg-primary bg-opacity-5 rounded-md">
              <p className="text-neutral-dark">
                <span className="font-medium">Insights:</span> {summary.insights}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <p className="text-neutral-medium mb-4">
              Complete more journal entries to receive your weekly insights.
            </p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full py-2 mt-2 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
        >
          View Full Report
        </Button>
      </div>
    </div>
  );
}
