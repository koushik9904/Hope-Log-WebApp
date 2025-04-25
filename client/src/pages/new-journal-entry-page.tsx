import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Loader2, PenLine, Calendar, AlertCircle, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntryTypeSelector } from "@/components/journal/entry-type-selector";
import { prepareLocalDateForStorage, formatLocalDate, isSameDay } from "@/lib/utils";

export default function NewJournalEntryPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [showEntrySelector, setShowEntrySelector] = useState(true);
  const [entryType, setEntryType] = useState<'journal' | 'chat' | null>(null);
  const queryClient = useQueryClient();

  // Get date and type parameters from URL if present
  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get('date');
  const typeParam = params.get('type');

  // Special handling for date parameter to prevent timezone issues
  const [entryDate, setEntryDate] = useState<Date>(() => {
    if (!dateParam) return new Date();
    
    // Parse the date parameter carefully to avoid timezone issues
    // The format is YYYY-MM-DD from the URL
    console.log(`🚨 Date param from URL: ${dateParam}`);
    
    try {
      const [year, month, day] = dateParam.split('-').map(num => parseInt(num));
      // Month is 0-indexed in JavaScript Date
      const parsedDate = new Date(year, month - 1, day);
      console.log(`🚨 Parsed date: ${parsedDate.toLocaleDateString()} (${parsedDate.toISOString()})`);
      return parsedDate;
    } catch (err) {
      console.error("Error parsing date param:", err);
      return new Date();
    }
  });

  // Create a today variable to use for comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if this is a past date entry using our isSameDay utility function
  // Use the properly parsed entryDate instead of directly parsing dateParam again
  const isPastDate = !isSameDay(entryDate, new Date());

  // Validate date is not in the future - compare dates only (not time)
  // Prepare dates for comparison by setting time to start of day
  const entryDateOnly = new Date(entryDate);
  entryDateOnly.setHours(0, 0, 0, 0);
  const todayOnly = new Date();
  todayOnly.setHours(0, 0, 0, 0);
  const isFutureDate = entryDateOnly > todayOnly;
  
  // Set entry type from URL parameter if available
  useEffect(() => {
    // Check for future dates
    if (isFutureDate) {
      toast({
        title: "Cannot create future entries",
        description: "Journal entries can only be created for today or past dates",
        variant: "destructive"
      });
      navigate('/journal');
      return;
    }
  
    if (typeParam === 'journal' || typeParam === 'chat') {
      setEntryType(typeParam);
      setShowEntrySelector(false);
    }
  }, [typeParam, isFutureDate, navigate, toast]);

  // Handle entry type selection
  const handleEntryTypeSelect = (type: 'chat' | 'journal') => {
    setEntryType(type);
    setShowEntrySelector(false);

    // If chat is selected, redirect to chat page
    if (type === 'chat') {
      navigate(`/chat${dateParam ? `?date=${dateParam}` : ''}`);
    }
  };

  const createJournalMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to create a journal entry");
      if (isFutureDate) throw new Error("Cannot create journal entries for future dates");

      // Use prepareLocalDateForStorage to ensure proper timezone handling
      // This now returns an ISO string directly with correct date preservation
      const dateISOString = prepareLocalDateForStorage(entryDate);

      const res = await apiRequest("POST", "/api/journal-entries", {
        content,
        userId: user.id,
        date: dateISOString,
        isJournal: true
      });

      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal entry created",
        description: "Your journal entry has been saved successfully."
      });

      // Invalidate journal entries query to refresh the list
      queryClient.invalidateQueries({
        queryKey: [`/api/journal-entries/${user?.id}`]
      });

      // Navigate back to journal list
      navigate("/journal");
    },
    onError: (error) => {
      console.error("Error creating journal entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create journal entry. Please try again.`
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some content for your journal entry."
      });
      return;
    }

    createJournalMutation.mutate();
  };

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

        {showEntrySelector ? (
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-6">How would you like to journal today?</h1>

            {isPastDate && (
              <Alert className="mb-6">
                <Calendar className="h-4 w-4" />
                <AlertTitle>Past Date Entry</AlertTitle>
                <AlertDescription>
                  You are creating a journal entry for {formatLocalDate(entryDate.toISOString())}
                </AlertDescription>
              </Alert>
            )}

            {isFutureDate && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Journal entries cannot be created for future dates.
                </AlertDescription>
              </Alert>
            )}

            <EntryTypeSelector 
              selectedDate={entryDate}
              onSelectType={handleEntryTypeSelect}
              className="mt-4"
            />
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                {isPastDate ? 'New Past Journal Entry' : 'New Journal Entry'}
              </CardTitle>
              {isPastDate && (
                <CardDescription className="flex items-center gap-1 text-amber-600">
                  <Calendar className="h-4 w-4" />
                  Creating entry for {formatLocalDate(entryDate.toISOString())}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isFutureDate && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Journal entries cannot be created for future dates.
                  </AlertDescription>
                </Alert>
              )}

              {isPastDate && !isFutureDate && (
                <Alert className="mb-4">
                  <Calendar className="h-4 w-4" />
                  <AlertTitle>Past Date Entry</AlertTitle>
                  <AlertDescription>
                    You are creating a journal entry for a past date. This will be added to your journal history.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Textarea
                    placeholder="Write your thoughts here..."
                    className="min-h-[300px] resize-y"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={createJournalMutation.isPending}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[#9AAB63] hover:bg-[#869650] text-white"
                    disabled={createJournalMutation.isPending || !content.trim()}
                  >
                    {createJournalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isPastDate ? 'Save Past Journal Entry' : 'Save Journal Entry'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}