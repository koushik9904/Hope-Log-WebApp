import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { JournalEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function JournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: entry, isLoading, error } = useQuery<JournalEntry>({
    queryKey: ["/api/journal-entries/entry", id],
    queryFn: async () => {
      const res = await fetch(`/api/journal-entries/entry/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch journal entry");
      }
      return res.json();
    },
  });
  
  if (error && id !== "new") {
    // Don't show toast or navigate on first render
    const errorShown = React.useRef(false);
    
    React.useEffect(() => {
      if (!errorShown.current) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to load journal entry. Please try again later."
        });
        navigate("/journal");
        errorShown.current = true;
      }
    }, [error, navigate, toast]);
    
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/journal")}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
                entry?.content ? (() => {
                  // Generate title from content
                  const content = entry.content;
                  if (!content || content.trim() === "") return "Untitled Entry";
                  
                  // Get first sentence or part of it
                  const firstSentence = content.split(/[.!?]/)[0]?.trim();
                  if (!firstSentence) return "Untitled Entry";
                  
                  // If sentence is short enough, use it directly
                  if (firstSentence.length <= 50) {
                    return firstSentence;
                  }
                  
                  // Otherwise, get first 5-7 words
                  const words = firstSentence.split(/\s+/).slice(0, 7);
                  let title = words.join(" ");
                  
                  // Add ellipsis if we truncated
                  if (words.length < firstSentence.split(/\s+/).length) {
                    title += "...";
                  }
                  
                  return title;
                })() : "Journal Entry"
              )}
            </CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-1/2" />
              ) : (
                entry?.date ? (
                  <div className="flex items-center">
                    <span>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {new Date(entry.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true // Ensures time is displayed in 12-hour format
                      })}
                    </span>
                  </div>
                ) : "No date available"
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </>
                ) : (
                  <div className="prose max-w-none dark:prose-invert">
                    <p>{entry?.content || "No summary available"}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="transcript" className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </>
                ) : (
                  <div className="prose max-w-none dark:prose-invert">
                    {entry?.transcript ? (
                      <div>
                        {entry.transcript.split("\n").map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p>No transcript available</p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Sentiment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {entry?.sentiment ? (
                          <div>
                            <div className="mb-4">
                              <span className="text-sm text-muted-foreground">Score: </span>
                              <span className="font-medium">{entry.sentiment.score}/5</span>
                            </div>
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Emotions:</h4>
                              <div className="flex flex-wrap gap-2">
                                {entry.sentiment.emotions.map((emotion, index) => (
                                  <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                                    {emotion}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No sentiment data available</p>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Themes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {entry?.sentiment?.themes && entry.sentiment.themes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {entry.sentiment.themes.map((theme, index) => (
                              <span key={index} className="bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-md text-xs">
                                {theme}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No themes identified</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}