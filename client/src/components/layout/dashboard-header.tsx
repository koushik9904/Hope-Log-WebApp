import { User } from "@shared/schema";
import { format } from "date-fns";
import { 
  Menu, 
  LogOut, 
  Home, 
  BookOpen, 
  BarChart2, 
  Target, 
  Settings,
  UserCircle,
  Lock,
  Bell,
  Shield,
  ShieldAlert,
  Sun,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  user: User | null;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");
  const { logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
  // Check if we're on any settings page
  const isSettingsActive = location.startsWith("/settings");
  
  // Update settings expansion when location changes
  useEffect(() => {
    if (isSettingsActive) {
      setSettingsExpanded(true);
    }
  }, [isSettingsActive]);

  const handleLogout = () => {
    logoutMutation.mutate();
    setMobileMenuOpen(false);
  };
  
  // Mobile menu link component
  const MobileNavLink = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => {
    const isActive = location === href;
    
    return (
      <Link href={href} 
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors rounded-lg",
          isActive && "bg-gray-700 text-white"
        )}
      >
        <div className="w-5 h-5 mr-3">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </Link>
    );
  };
  
  // Mobile menu sub-link component
  const MobileSubNavLink = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => {
    const isActive = location === href;
    
    return (
      <Link href={href} 
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors rounded-lg ml-6",
          isActive && "bg-gray-700 text-white"
        )}
      >
        <div className="w-4 h-4 mr-3">
          {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <header className="bg-black shadow-sm p-4 md:p-6 border-b border-gray-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div>
            <h1 className="text-xl font-semibold font-['Montserrat_Variable'] text-white">
              Welcome back, {user?.displayName || user?.name || user?.username}
            </h1>
            <p className="text-gray-400 text-sm">{formattedDate}</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <NotificationDropdown />
          
          <div className="relative group">
            <button className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                {(user?.displayName || user?.name || user?.username)?.charAt(0).toUpperCase()}
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
        
        <div className="md:hidden relative">
          <button 
            className="p-2 rounded-xl text-white hover:bg-gray-700 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-xl shadow-lg border border-gray-700 py-2 z-50 overflow-y-auto max-h-[80vh]">
              <div className="px-4 py-2 border-b border-gray-700">
                <h3 className="text-white font-medium">Menu</h3>
              </div>
              
              <div className="p-2 space-y-1">
                <MobileNavLink 
                  href="/" 
                  icon={<Home className="w-full h-full" />} 
                  label="Dashboard" 
                />
                <MobileNavLink 
                  href="/journal" 
                  icon={<BookOpen className="w-full h-full" />} 
                  label="Journal" 
                />
                <MobileNavLink 
                  href="/insights" 
                  icon={<BarChart2 className="w-full h-full" />} 
                  label="Insights" 
                />
                <MobileNavLink 
                  href="/goals" 
                  icon={<Target className="w-full h-full" />} 
                  label="Goals & Habits" 
                />
                
                <div className="my-2 border-t border-gray-700"></div>
                
                <a 
                  href="https://jazeeljabbar.substack.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-5 h-5 mr-3">
                    <ExternalLink className="w-full h-full" />
                  </div>
                  <span className="font-medium">Blog</span>
                </a>
                
                <MobileNavLink 
                  href="/about-us" 
                  icon={<Info className="w-full h-full" />} 
                  label="About Us" 
                />
                
                <MobileNavLink 
                  href="/subscription" 
                  icon={<CreditCard className="w-full h-full" />} 
                  label="Subscription" 
                />
                
                {/* Settings button with sub-menu */}
                <div className="py-1">
                  <button
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    className="flex items-center px-4 py-3 w-full text-left text-gray-300 hover:bg-gray-700 transition-colors rounded-lg"
                  >
                    <div className="w-5 h-5 mr-3">
                      <Settings className="w-full h-full" />
                    </div>
                    <span className="font-medium">Settings</span>
                    <div className="ml-auto">
                      {settingsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  
                  {/* Sub-navigation items */}
                  {settingsExpanded && (
                    <div className="mt-1 space-y-1">
                      <MobileSubNavLink 
                        href="/settings/profile" 
                        icon={<UserCircle className="w-full h-full text-[#F5B8DB]" />} 
                        label="Profile" 
                      />
                      <MobileSubNavLink 
                        href="/settings/password" 
                        icon={<Lock className="w-full h-full text-[#9AAB63]" />} 
                        label="Password" 
                      />
                      <MobileSubNavLink 
                        href="/settings/notifications" 
                        icon={<Bell className="w-full h-full text-[#F5D867]" />} 
                        label="Notifications" 
                      />
                      <MobileSubNavLink 
                        href="/settings/privacy" 
                        icon={<Shield className="w-full h-full text-[#B6CAEB]" />} 
                        label="Privacy" 
                      />
                      <MobileSubNavLink 
                        href="/settings/appearance" 
                        icon={<Sun className="w-full h-full text-[#F5D867]" />} 
                        label="Appearance" 
                      />
                      <MobileSubNavLink 
                        href="/settings/data" 
                        icon={<Download className="w-full h-full text-[#F5B8DB]" />} 
                        label="Data & Export" 
                      />
                    </div>
                  )}
                </div>
                
                {/* Admin section - only visible to admins */}
                {user?.isAdmin && (
                  <>
                    <div className="my-2 border-t border-gray-700"></div>
                    <MobileNavLink 
                      href="/admin" 
                      icon={<ShieldAlert className="w-full h-full text-red-500" />} 
                      label="Admin Dashboard" 
                    />
                  </>
                )}
                
                <div className="my-2 border-t border-gray-700"></div>
                
                {/* Logout button */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 w-full text-left text-gray-300 hover:bg-gray-700 transition-colors rounded-lg"
                >
                  <div className="w-5 h-5 mr-3">
                    <LogOut className="w-full h-full text-red-400" />
                  </div>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside handler for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
}
