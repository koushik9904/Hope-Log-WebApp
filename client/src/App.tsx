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
import JournalEntryPage from "@/pages/journal-entry-page";
import NewJournalEntryPage from "@/pages/new-journal-entry-page";
import InsightsPage from "@/pages/insights-page";
import GoalsPage from "@/pages/goals-page";
import SettingsPage from "@/pages/settings-page";
import SettingsProfilePage from "@/pages/settings-profile-page";
import SettingsPasswordPage from "@/pages/settings-password-page";
import SettingsNotificationsPage from "@/pages/settings-notifications-page";
import SettingsPrivacyPage from "@/pages/settings-privacy-page";
import SettingsAppearancePage from "@/pages/settings-appearance-page";
import SettingsDataPage from "@/pages/settings-data-page";
import AdminOAuthPage from "@/pages/admin-oauth-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import NotFound from "@/pages/not-found";
import AboutUsPage from "@/pages/about-us-page";
import ApiAccessPage from "@/pages/api-access-page";
import IntegrationsPage from "@/pages/integrations-page";
import PrivacyPolicyPage from "@/pages/privacy-policy-page";
import TermsOfServicePage from "@/pages/terms-of-service-page";
import HelpCenterPage from "@/pages/help-center-page";
import CommunityPage from "@/pages/community-page";
import MentalHealthResourcesPage from "@/pages/mental-health-resources-page";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // If user is an admin, show only admin routes
  if (user?.isAdmin) {
    return (
      <Switch>
        <Route path="/admin/oauth" component={AdminOAuthPage} />
        <Route path="/admin" component={AdminDashboardPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={AdminDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // If user is not logged in and visiting root path, show landing page
  if (location === "/" && !user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        <Route path="/" component={LandingPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Regular user routes
  return (
    <Switch>
      <ProtectedRoute path="/journal/new" component={NewJournalEntryPage} />
      <ProtectedRoute path="/journal/:id" component={JournalEntryPage} />
      <ProtectedRoute path="/journal" component={JournalPage} />
      <ProtectedRoute path="/insights" component={InsightsPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/settings/profile" component={SettingsProfilePage} />
      <ProtectedRoute path="/settings/password" component={SettingsPasswordPage} />
      <ProtectedRoute path="/settings/notifications" component={SettingsNotificationsPage} />
      <ProtectedRoute path="/settings/privacy" component={SettingsPrivacyPage} />
      <ProtectedRoute path="/settings/appearance" component={SettingsAppearancePage} />
      <ProtectedRoute path="/settings/data" component={SettingsDataPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/about-us" component={AboutUsPage} />
      <Route path="/api-access" component={ApiAccessPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/help-center" component={HelpCenterPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/mental-health-resources" component={MentalHealthResourcesPage} />
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
