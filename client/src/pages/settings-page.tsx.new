import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Redirect } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function SettingsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to profile settings by default
  useEffect(() => {
    if (location === "/settings") {
      setLocation("/settings/profile");
    }
  }, [location, setLocation]);
  
  if (!user) return null;

  // This is now just a redirect component
  return (
    <DashboardLayout>
      <Redirect to="/settings/profile" />
    </DashboardLayout>
  );
}