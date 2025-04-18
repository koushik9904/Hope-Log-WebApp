import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  BarChart2, 
  Target, 
  Settings,
  LogOut
} from "lucide-react";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  type NavLinkProps = {
    href: string;
    icon: React.ReactNode;
    label: string;
  };

  const NavLink = ({ href, icon, label }: NavLinkProps) => {
    const isActive = location === href;
    
    return (
      <Link href={href} className={cn(
          "flex items-center px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors",
          isActive && "bg-gray-800 text-white border-r-2 border-[#F5B8DB]"
        )}>
          <div className="w-5 h-5 mr-3">
            {icon}
          </div>
          <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="hidden md:flex md:fixed md:h-full md:w-64 bg-gray-900 shadow-sm border-r border-gray-800">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-center p-6">
          <HopeLogLogo size="md" withText className="w-auto" />
        </div>
        
        <div className="px-6 py-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Main Menu</span>
        </div>
        
        <NavLink 
          href="/" 
          icon={<Home className="w-full h-full" />} 
          label="Dashboard" 
        />
        <NavLink 
          href="/journal" 
          icon={<BookOpen className="w-full h-full" />} 
          label="Journal" 
        />
        <NavLink 
          href="/insights" 
          icon={<BarChart2 className="w-full h-full" />} 
          label="Insights" 
        />
        <NavLink 
          href="/goals" 
          icon={<Target className="w-full h-full" />} 
          label="Goals & Habits" 
        />
        <NavLink 
          href="/settings" 
          icon={<Settings className="w-full h-full" />} 
          label="Settings" 
        />
        
        <div className="mt-auto p-4">
          <div className="rounded-xl bg-gray-800 p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-gray-400">Standard Plan</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-3 w-full py-2 rounded-xl border border-gray-700 text-sm text-white hover:bg-gray-700 flex items-center justify-center font-medium transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
