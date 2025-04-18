import { User } from "@shared/schema";
import { format } from "date-fns";
import { Bell, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
    <header className="bg-white shadow-sm p-4 md:p-6 border-b border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white mr-3 hidden md:flex">
            <span className="font-bold">H</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold font-['Nunito_Variable'] text-gray-800">
              Welcome back, {user?.username}
            </h1>
            <p className="text-gray-500 text-sm">{formattedDate}</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 invisible group-hover:visible z-50">
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
        
        <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
