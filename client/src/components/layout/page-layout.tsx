import React from "react";
import { Sidebar } from "./sidebar";

type PageLayoutProps = {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
  className?: string;
};

export function PageLayout({ 
  children, 
  heading, 
  subheading,
  className = ""
}: PageLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 md:ml-64 min-h-screen bg-[#FFF8E8]">
        <div className={`container max-w-5xl py-8 px-4 md:px-8 ${className}`}>
          {(heading || subheading) && (
            <div className="mb-6">
              {heading && <h1 className="text-3xl font-semibold mb-2">{heading}</h1>}
              {subheading && <p className="text-muted-foreground">{subheading}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}