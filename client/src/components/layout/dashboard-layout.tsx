import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div id="app" className="flex flex-col min-h-screen bg-neutral-lightest">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-grow md:ml-64 pb-16 md:pb-0">
        <DashboardHeader user={user} />
        
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}