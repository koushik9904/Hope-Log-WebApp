import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Summary } from "@shared/schema";
import { BarChart4, Calendar, Sparkles, Brain, ChevronRight } from "lucide-react";
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
    <div className="rosebud-card">
      <div className="rosebud-card-header">
        <div>
          <h2 className="rosebud-card-title">Weekly Insights</h2>
          <p className="rosebud-card-subtitle">{startDateStr} - {endDateStr}</p>
        </div>
        <div className="bg-primary/10 p-2 rounded-full">
          <BarChart4 className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4 my-4">
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-20" />
        </div>
      ) : summary ? (
        <div className="space-y-4 my-4">
          <div className="bg-rose-50 rounded-2xl p-4">
            <h3 className="text-base font-semibold mb-3 text-gray-800">
              Top Emotions
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.topEmotions.map((emotion, index) => (
                <Badge key={index} className="bg-white border border-rose-200 text-gray-700 px-3 py-1 rounded-full">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-2xl p-4">
            <h3 className="text-base font-semibold mb-3 text-gray-800">
              Common Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.commonThemes.map((theme, index) => (
                <Badge key={index} className="bg-white border border-amber-200 text-gray-700 px-3 py-1 rounded-full">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="bg-violet-50 rounded-2xl p-4">
            <h3 className="text-base font-semibold mb-3 text-gray-800">
              Key Insights
            </h3>
            <p className="text-gray-700">{summary.insights}</p>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 my-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BarChart4 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Summary Yet</h3>
          <p className="text-gray-600 mb-6">
            Complete more journal entries to receive your weekly insights.
          </p>
        </div>
      )}
      
      <button className="w-full py-3 text-primary font-medium flex items-center justify-center">
        View Full Report <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  );
}
