import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { JournalChat } from '@/components/journal/journal-chat';
import { SimplePageHeader } from '@/components/layout/simple-page-header';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from 'lucide-react';
import { isSameDay, formatLocalDate } from '@/lib/utils';

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get the date from URL query param if available
  const searchParams = new URLSearchParams(window.location.search);
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  
  // Check if selected date is a past date (not today)
  const isPastDate = dateParam && !isSameDay(selectedDate, new Date());
  
  // Prevent users from creating entries for future dates
  useEffect(() => {
    // Create dates with time set to midnight for proper comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly > today) {
      toast({
        title: "Cannot create future entries",
        description: "Journal entries can only be created for today or past dates",
        variant: "destructive"
      });
      navigate('/journal');
    }
  }, [selectedDate, navigate, toast]);
  
  if (!user) {
    return null; // The ProtectedRoute component will handle redirection
  }

  return (
    <div className="container px-4 mx-auto max-w-6xl py-6">
      <SimplePageHeader
        title="Chat with Hope Log"
        description="Have a thoughtful conversation with Hope Log. Your conversation can be saved as a journal entry when you're done."
        backLink="/journal"
        backLinkText="Back to Journal"
      />
      
      {isPastDate && (
        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <Calendar className="h-4 w-4 text-blue-500" />
          <AlertDescription className="flex items-center text-blue-700">
            You are chatting with Hope Log for <strong className="mx-1">{formatLocalDate(selectedDate.toISOString())}</strong>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-6">
        <JournalChat userId={user.id} selectedDate={selectedDate} />
      </div>
    </div>
  );
}