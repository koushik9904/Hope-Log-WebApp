import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Pencil, Calendar, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface EntryTypeSelectorProps {
  selectedDate?: Date;
  onSelectType?: (type: 'chat' | 'journal') => void;
  className?: string;
  linkMode?: boolean;
}

export function EntryTypeSelector({
  selectedDate = new Date(),
  onSelectType,
  className = "",
  linkMode = false
}: EntryTypeSelectorProps) {
  const { toast } = useToast();
  const dateParam = selectedDate.toISOString().split('T')[0];
  
  // Check if the selected date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDateOnly = new Date(selectedDate);
  selectedDateOnly.setHours(0, 0, 0, 0);
  
  const isFutureDate = selectedDateOnly > today;
  
  // Function to show warning when trying to journal for future dates
  const handleFutureDateWarning = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Cannot create future entries",
      description: "Journal entries can only be created for today or past dates",
      variant: "destructive"
    });
  };
  
  // If in link mode, we'll use wouter Link components to navigate
  // Otherwise we'll use buttons that call the onSelectType callback
  
  if (linkMode) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        {isFutureDate ? (
          // Disabled card for future dates - Journal
          <div onClick={handleFutureDateWarning}>
            <Card className="relative overflow-hidden border border-gray-200 shadow-sm opacity-60 cursor-not-allowed">
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/5">
                <div className="bg-white/90 px-4 py-2 rounded-md flex items-center">
                  <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                  <span className="text-sm font-medium text-destructive">Future date</span>
                </div>
              </div>
              <CardHeader className="bg-gradient-to-r from-[#F5B8DB]/10 to-white">
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#F5B8DB]" />
                  Journal Entry
                </CardTitle>
                <CardDescription>
                  Write a traditional journal entry
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">
                  Type freely and express your thoughts in a structured format. Great for reflection and documenting your day.
                </p>
                <Button disabled className="w-full mt-4 bg-[#F5B8DB]/50 text-white cursor-not-allowed">
                  Start Writing
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Normal card for current or past dates - Journal
          <Link href={`/journal/new?type=journal&date=${dateParam}`}>
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#F5B8DB]/10 to-white">
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#F5B8DB]" />
                  Journal Entry
                </CardTitle>
                <CardDescription>
                  Write a traditional journal entry
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">
                  Type freely and express your thoughts in a structured format. Great for reflection and documenting your day.
                </p>
                <Button className="w-full mt-4 bg-[#F5B8DB] hover:bg-[#D49ABD] text-white">
                  Start Writing
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}
        
        {isFutureDate ? (
          // Disabled card for future dates - Chat
          <div onClick={handleFutureDateWarning}>
            <Card className="relative overflow-hidden border border-gray-200 shadow-sm opacity-60 cursor-not-allowed">
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/5">
                <div className="bg-white/90 px-4 py-2 rounded-md flex items-center">
                  <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                  <span className="text-sm font-medium text-destructive">Future date</span>
                </div>
              </div>
              <CardHeader className="bg-gradient-to-r from-[#B6CAEB]/10 to-white">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#B6CAEB]" />
                  Chat with Hope Log
                </CardTitle>
                <CardDescription>
                  Have a conversation with our AI companion
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">
                  Chat naturally with our AI to reflect, problem-solve, or just share what's on your mind in a conversational way.
                </p>
                <Button disabled className="w-full mt-4 bg-[#B6CAEB]/50 text-white cursor-not-allowed">
                  Start Chatting
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Normal card for current or past dates - Chat
          <Link href={`/chat?date=${dateParam}`}>
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#B6CAEB]/10 to-white">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#B6CAEB]" />
                  Chat with Hope Log
                </CardTitle>
                <CardDescription>
                  Have a conversation with our AI companion
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">
                  Chat naturally with our AI to reflect, problem-solve, or just share what's on your mind in a conversational way.
                </p>
                <Button className="w-full mt-4 bg-[#B6CAEB] hover:bg-[#93A7C8] text-white">
                  Start Chatting
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    );
  }
  
  // Button mode for callback handling
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <Card 
        className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 shadow-sm"
        onClick={() => onSelectType && onSelectType('journal')}
      >
        <CardHeader className="bg-gradient-to-r from-[#F5B8DB]/10 to-white">
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-[#F5B8DB]" />
            Journal Entry
          </CardTitle>
          <CardDescription>
            Write a traditional journal entry
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            Type freely and express your thoughts in a structured format. Great for reflection and documenting your day.
          </p>
          <Button className="w-full mt-4 bg-[#F5B8DB] hover:bg-[#D49ABD] text-white">
            Start Writing
          </Button>
        </CardContent>
      </Card>
      
      <Card 
        className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 shadow-sm"
        onClick={() => onSelectType && onSelectType('chat')}
      >
        <CardHeader className="bg-gradient-to-r from-[#B6CAEB]/10 to-white">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#B6CAEB]" />
            Chat with Hope Log
          </CardTitle>
          <CardDescription>
            Have a conversation with our AI companion
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            Chat naturally with our AI to reflect, problem-solve, or just share what's on your mind in a conversational way.
          </p>
          <Button className="w-full mt-4 bg-[#B6CAEB] hover:bg-[#93A7C8] text-white">
            Start Chatting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}