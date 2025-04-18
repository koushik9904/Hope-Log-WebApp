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
      <Link href={href}>
        <a className={cn(
          "flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors",
          isActive && "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
        )}>
          <div className="w-5 h-5 mr-3">
            {icon}
          </div>
          <span className="font-medium">{label}</span>
        </a>
      </Link>
    );
  };

  return (
    <div className="hidden md:flex md:fixed md:h-full md:w-64 bg-white shadow-sm border-r border-gray-100">
      <div className="flex flex-col w-full">
        <div className="flex items-center p-6">
          <div className="w-10 h-10 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white mr-2">
            <span className="text-lg font-bold">H</span>
          </div>
          <h1 className="text-xl font-bold font-['Nunito_Variable'] text-gray-800">Hope Log</h1>
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
          <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-500">Standard Plan</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-3 w-full py-2 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 flex items-center justify-center font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
