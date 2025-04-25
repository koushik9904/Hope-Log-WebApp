import { User } from "@shared/schema";
import { format } from "date-fns";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

type DashboardHeaderProps = {
  user: User | null;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-black shadow-sm p-4 md:p-6 border-b border-gray-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div>
            <h1 className="text-xl font-semibold font-['Montserrat_Variable'] text-white">
              Welcome back, {user?.username}
            </h1>
            <p className="text-gray-400 text-sm">{formattedDate}</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <NotificationDropdown />
          
          <div className="relative group">
            <button className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg border border-gray-700 py-1 invisible group-hover:visible z-50">
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-white hover:bg-gray-700 w-full text-left transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
        
        <button className="md:hidden p-2 rounded-xl text-white hover:bg-gray-700 transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
