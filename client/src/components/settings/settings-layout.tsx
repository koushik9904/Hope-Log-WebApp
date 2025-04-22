import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Lock,
  KeySquare
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface SettingsLayoutProps {
  children: ReactNode;
}

// Define sidebar navigation items
const navigationItems = [
  {
    label: "Profile",
    href: "/settings/profile",
    icon: User,
  },
  {
    label: "Password",
    href: "/settings/password",
    icon: Lock,
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    label: "Privacy",
    href: "/settings/privacy",
    icon: Shield,
  },
  {
    label: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    label: "Data",
    href: "/settings/data",
    icon: Database,
  },
  {
    label: "OAuth Integration",
    href: "/settings/oauth",
    icon: KeySquare,
  },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="container py-8 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
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