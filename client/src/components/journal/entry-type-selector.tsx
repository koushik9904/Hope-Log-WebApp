import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Pencil } from "lucide-react";
import { Link } from "wouter";

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
  const dateParam = selectedDate.toISOString().split('T')[0];
  
  // If in link mode, we'll use wouter Link components to navigate
  // Otherwise we'll use buttons that call the onSelectType callback
  
  if (linkMode) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <Link href="/journal/new?type=journal&date=${dateParam}">
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
        
        <Link href="/chat?date=${dateParam}">
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