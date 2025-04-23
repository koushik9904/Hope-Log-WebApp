import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import React, { Suspense } from "react";

// Simplifying to check for circular dependencies and loading issues
console.log("Loading App.tsx");

// Import essential pages only to reduce complexity
import HomePage from "@/pages/home-page";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Import these only when the core app is working
import JournalPage from "@/pages/journal-page";
import SubscriptionPage from "@/pages/subscription-page";
import { useAuth } from "@/hooks/use-auth";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    <p className="ml-2">Loading Hope Log...</p>
  </div>
);

// Simple router function for debugging
function Router() {
  console.log("Router function executing");
  
  try {
    const { user } = useAuth();
    const [location] = useLocation();
    
    console.log("User state:", user ? "Logged in" : "Not logged in");
    console.log("Current location:", location);
    
    // Very simple routing for testing
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/journal" component={JournalPage} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/" component={user ? HomePage : LandingPage} />
        <Route component={NotFound} />
      </Switch>
    );
  } catch (error) {
    console.error("Error in Router:", error);
    return <LoadingFallback />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
