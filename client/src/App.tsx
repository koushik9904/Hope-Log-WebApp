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
import JournalPage from "@/pages/journal-page";
import InsightsPage from "@/pages/insights-page";
import GoalsPage from "@/pages/goals-page";
import SettingsPage from "@/pages/settings-page";
import SettingsProfilePage from "@/pages/settings-profile-page";
import SettingsPasswordPage from "@/pages/settings-password-page";
import SettingsNotificationsPage from "@/pages/settings-notifications-page";
import SettingsPrivacyPage from "@/pages/settings-privacy-page";
import SettingsAppearancePage from "@/pages/settings-appearance-page";
import SettingsDataPage from "@/pages/settings-data-page";
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
        <ProtectedRoute path="/journal" component={JournalPage} />
        <ProtectedRoute path="/insights" component={InsightsPage} />
        <ProtectedRoute path="/goals" component={GoalsPage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/settings/profile" component={SettingsProfilePage} />
        <ProtectedRoute path="/settings/password" component={SettingsPasswordPage} />
        <ProtectedRoute path="/settings/notifications" component={SettingsNotificationsPage} />
        <ProtectedRoute path="/settings/privacy" component={SettingsPrivacyPage} />
        <ProtectedRoute path="/settings/appearance" component={SettingsAppearancePage} />
        <ProtectedRoute path="/settings/data" component={SettingsDataPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/journal" component={JournalPage} />
      <ProtectedRoute path="/insights" component={InsightsPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/settings/profile" component={SettingsProfilePage} />
      <ProtectedRoute path="/settings/password" component={SettingsPasswordPage} />
      <ProtectedRoute path="/settings/notifications" component={SettingsNotificationsPage} />
      <ProtectedRoute path="/settings/privacy" component={SettingsPrivacyPage} />
      <ProtectedRoute path="/settings/appearance" component={SettingsAppearancePage} />
      <ProtectedRoute path="/settings/data" component={SettingsDataPage} />
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
