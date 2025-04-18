import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // If user is not logged in and visiting root path, show landing page
  if (location === "/" && !user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/journal" component={HomePage} />
        <ProtectedRoute path="/insights" component={HomePage} />
        <ProtectedRoute path="/goals" component={HomePage} />
        <ProtectedRoute path="/settings" component={HomePage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/journal" component={HomePage} />
      <ProtectedRoute path="/insights" component={HomePage} />
      <ProtectedRoute path="/goals" component={HomePage} />
      <ProtectedRoute path="/settings" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
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
