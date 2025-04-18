import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const NavLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = location === href;
    
    return (
      <Link href={href}>
        <a className={cn(
          "flex items-center px-6 py-3",
          isActive 
            ? "bg-primary bg-opacity-10 text-primary" 
            : "text-neutral-medium hover:bg-neutral-light"
        )}>
          <i className={`${icon} mr-3`}></i>
          <span>{label}</span>
        </a>
      </Link>
    );
  };

  return (
    <div className="hidden md:flex md:fixed md:h-full md:w-64 bg-white shadow-lg">
      <div className="flex flex-col w-full">
        <div className="flex items-center p-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <i className="ri-mental-health-line text-white text-xl"></i>
          </div>
          <h1 className="ml-3 text-xl font-semibold font-nunito text-neutral-dark">HopeLog AI</h1>
        </div>
        
        <div className="px-4 py-2">
          <span className="text-xs text-neutral-medium uppercase tracking-wider">Menu</span>
        </div>
        
        <NavLink href="/" icon="ri-home-5-line" label="Dashboard" />
        <NavLink href="/journal" icon="ri-book-line" label="Journal" />
        <NavLink href="/insights" icon="ri-line-chart-line" label="Insights" />
        <NavLink href="/goals" icon="ri-target-line" label="Goals & Habits" />
        <NavLink href="/settings" icon="ri-settings-3-line" label="Settings" />
        
        <div className="mt-auto p-4">
          <div className="rounded-card bg-primary bg-opacity-5 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-dark">{user?.username}</p>
                <p className="text-xs text-neutral-medium">Standard Plan</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-3 text-sm text-neutral-medium hover:text-primary flex items-center"
            >
              <i className="ri-logout-box-line mr-1"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
