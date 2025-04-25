import React from 'react';
import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';

interface SimplePageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLinkText?: string;
}

export function SimplePageHeader({ 
  title, 
  description, 
  backLink,
  backLinkText = "Back"
}: SimplePageHeaderProps) {
  return (
    <div className="mb-6">
      {backLink && (
        <Link href={backLink} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {backLinkText}
        </Link>
      )}
      
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
      
      {description && (
        <p className="text-gray-600 max-w-3xl">{description}</p>
      )}
    </div>
  );
}