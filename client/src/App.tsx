import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import React, { Suspense, lazy } from "react";

// Simplifying to check for circular dependencies and loading issues
console.log("Loading App.tsx");

// Import essential pages directly
import HomePage from "@/pages/home-page";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

// Use lazy loading for other pages to improve performance
const JournalPage = lazy(() => import("@/pages/journal-page"));
const InsightsPage = lazy(() => import("@/pages/insights-page"));
const GoalsPage = lazy(() => import("@/pages/goals-page"));
const SubscriptionPage = lazy(() => import("@/pages/subscription-page"));
const AboutUsPage = lazy(() => import("@/pages/about-us-page"));

// Settings pages
const SettingsProfilePage = lazy(() => import("@/pages/settings-profile-page"));
const SettingsPasswordPage = lazy(() => import("@/pages/settings-password-page"));
const SettingsNotificationsPage = lazy(() => import("@/pages/settings-notifications-page"));
const SettingsPrivacyPage = lazy(() => import("@/pages/settings-privacy-page"));
const SettingsAppearancePage = lazy(() => import("@/pages/settings-appearance-page"));
const SettingsDataPage = lazy(() => import("@/pages/settings-data-page"));

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
    
    // Complete routing with lazy-loaded components wrapped in Suspense
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        {/* Main pages */}
        {/* Protected Routes - Require Authentication */}
        <ProtectedRoute 
          path="/journal" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <JournalPage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/insights" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <InsightsPage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/goals" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <GoalsPage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/subscription" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SubscriptionPage />
            </Suspense>
          )} 
        />
        
        {/* Public Routes */}
        <Route path="/about-us">
          <Suspense fallback={<LoadingFallback />}>
            <AboutUsPage />
          </Suspense>
        </Route>
        
        {/* Protected Settings Pages */}
        <ProtectedRoute 
          path="/settings/profile" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SettingsProfilePage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/settings/password" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SettingsPasswordPage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/settings/notifications" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SettingsNotificationsPage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/settings/privacy" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SettingsPrivacyPage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/settings/appearance" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SettingsAppearancePage />
            </Suspense>
          )} 
        />
        <ProtectedRoute 
          path="/settings/data" 
          component={() => (
            <Suspense fallback={<LoadingFallback />}>
              <SettingsDataPage />
            </Suspense>
          )} 
        />
        
        {/* Landing or Home depending on login status */}
        <Route path="/" component={user ? HomePage : LandingPage} />
        
        {/* Fallback for unknown routes */}
        <Route component={NotFound} />
      </Switch>
    );
  } catch (error) {
    console.error("Error in Router:", error);
    return <LoadingFallback />;
  }
}

function App() {
  console.log("Starting application rendering...");
  
  // Get the root element to check if it exists
  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log("Root element found, rendering application");
    // Add a small delay to log when rendering is actually completed
    setTimeout(() => {
      console.log("Application rendered successfully");
    }, 0);
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<LoadingFallback />}>
            <Router />
          </Suspense>
          <div id="app-loaded" style={{ display: 'none' }}></div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
