import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  KeySquare,
  ShieldAlert,
  Settings,
  Home,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: ReactNode;
}

// Define sidebar navigation items
const navigationItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    label: "OAuth Settings",
    href: "/admin/oauth",
    icon: KeySquare,
  },
  {
    label: "User Settings",
    href: "/admin/users",
    icon: Settings,
  },
  {
    label: "Back to App",
    href: "/",
    icon: LogOut,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="container py-8 min-h-screen">
        <div className="flex items-center justify-center flex-col min-h-[60vh]">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-3xl font-bold tracking-tight mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin area
          </p>
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage system settings and configurations
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar navigation */}
        <aside className="md:w-1/4 flex-shrink-0">
          <nav className="space-y-1 sticky top-20">
            {navigationItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-muted"
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>
        
        <Separator orientation="vertical" className="hidden md:block" />
        
        {/* Main content */}
        <div className="flex-1 md:max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}