import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { JournalChat } from '@/components/journal/journal-chat';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get the date from URL query param if available
  const searchParams = new URLSearchParams(window.location.search);
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  
  // Prevent users from creating entries for future dates
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
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
      <PageHeader
        title="Chat with Hope Log"
        description="Have a thoughtful conversation with Hope Log. Your conversation can be saved as a journal entry when you're done."
        backLink="/journal"
        backLinkText="Back to Journal"
      />
      
      <div className="mt-6">
        <JournalChat userId={user.id} />
      </div>
    </div>
  );
}