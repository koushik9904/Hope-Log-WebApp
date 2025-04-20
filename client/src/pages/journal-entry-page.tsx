import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { JournalEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import hopeLogLogo from "../assets/HopeLog_logo-Photoroom.png";

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
        
        <Card className="bg-[#FFF8E8] border-0 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-white/80 text-xs font-normal uppercase tracking-wider px-2.5 py-0.5">
                {entry?.isAiResponse ? "AI Response" : "Journal Entry"}
              </Badge>
              
              {!isLoading && entry?.sentiment?.emotions && entry?.sentiment?.emotions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {entry.sentiment.emotions[0]}
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-2xl font-serif text-gray-800">
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
            
            <CardDescription className="text-gray-600 flex items-center text-sm mt-2">
              {isLoading ? (
                <Skeleton className="h-4 w-1/2" />
              ) : (
                entry?.date ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary/70" />
                    <span className="font-medium">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="flex items-center text-gray-500">
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
          
          <CardContent className="p-0">
            <Tabs defaultValue="summary" className="w-full">
              <div className="border-b bg-gray-50/50">
                <div className="container mx-auto px-6">
                  <TabsList className="bg-transparent h-12 border-0 p-0 mt-0">
                    <TabsTrigger value="summary" className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none h-12 px-4">Summary</TabsTrigger>
                    <TabsTrigger value="transcript" className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none h-12 px-4">Full Transcript</TabsTrigger>
                    <TabsTrigger value="insights" className="rounded-none data-[state=active]:border-b-2 border-primary data-[state=active]:shadow-none h-12 px-4">Insights</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <div className="p-6">
                <TabsContent value="summary" className="mt-0 border-0 p-0">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </>
                  ) : (
                    <div className="prose max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4 prose-headings:text-gray-900">
                      <div className="border-l-4 border-primary/20 pl-4 py-1 italic font-light">
                        {entry?.content || "No summary available"}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="transcript" className="mt-0 border-0 p-0">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </>
                  ) : (
                    <div className="prose max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4">
                      {entry?.transcript ? (
                        <div className="space-y-4">
                          {entry.transcript.split("\n").map((line, index) => {
                            // Check if line is from AI or user
                            const isAI = line.startsWith("Hope Log:") || line.startsWith("AI:");
                            const messageText = isAI 
                              ? line.replace(/^(Hope Log:|AI:)\s*/, "").trim()
                              : line.replace(/^(You:|User:)\s*/, "").trim();
                              
                            return (
                              <div 
                                key={index} 
                                className={`flex items-start gap-3 rounded-lg p-3 ${isAI ? 'bg-blue-50' : 'bg-gray-50'}`}
                              >
                                {isAI ? (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                                    <img 
                                      src={hopeLogLogo} 
                                      alt="Hope Log" 
                                      className="w-7 h-7 object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                      <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                  </div>
                                )}
                                
                                <div className={`flex-1 px-3 py-2 rounded-lg ${isAI ? 'border-l-4 border-blue-200' : 'border-l-4 border-gray-200'}`}>
                                  <p className="my-0 text-sm">{messageText}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p>No transcript available</p>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="insights" className="mt-0 border-0 p-0">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-white border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><path d="M14 13.5A1.5 1.5 0 0 0 12.5 12"></path><path d="M18.5 12c0-4.7-3.8-8.5-8.5-8.5S1.5 7.3 1.5 12H18.5z"></path><path d="M14 12v1.5"></path><path d="M7 16h9"></path><path d="M8 20h7"></path><path d="M12 12v8"></path><path d="M12.5 12a1.5 1.5 0 0 0-1.5-1.5"></path><path d="M1.5 12a10.5 10.5 0 1 0 21 0z"></path></svg>
                            Sentiment Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {entry?.sentiment ? (
                            <div>
                              <div className="mb-5">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-sm text-gray-500">Overall Mood:</span>
                                  <span className="font-medium text-primary">
                                    {entry.sentiment.score}/5
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                  <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${(entry.sentiment.score / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-3 text-gray-700">Emotional Tones:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {entry.sentiment.emotions.map((emotion, index) => (
                                    <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                                      {emotion}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No sentiment data available</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-white border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            Key Themes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {entry?.sentiment?.themes && entry.sentiment.themes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {entry.sentiment.themes.map((theme, index) => (
                                <span key={index} className="bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                                  {theme}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No themes identified</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}