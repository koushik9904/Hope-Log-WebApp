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
  LogOut,
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
import React, { useState, useEffect } from "react";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Check if we're on any settings page
  const isSettingsActive = location.startsWith("/settings");
  
  // Auto-expand settings menu when on settings pages
  const [settingsExpanded, setSettingsExpanded] = useState(isSettingsActive);
  
  // Update expansion when location changes
  useEffect(() => {
    if (isSettingsActive) {
      setSettingsExpanded(true);
    }
  }, [isSettingsActive]);

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
  
  const SubNavLink = ({ href, icon, label }: NavLinkProps) => {
    const isActive = location === href;
    
    return (
      <Link href={href} className={cn(
          "flex items-center px-6 py-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors pl-14",
          isActive && "bg-gray-800 text-white"
        )}>
          <div className="w-4 h-4 mr-3">
            {icon}
          </div>
          <span className="font-medium text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="hidden md:flex md:fixed md:h-full md:w-64 bg-gray-900 shadow-sm border-r border-gray-800 overflow-hidden">
      <div className="flex flex-col w-full h-full overflow-y-auto">
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
        
        <div className="px-6 py-3 mt-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Resources</span>
        </div>
        
        <a 
          href="https://jazeeljabbar.substack.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <div className="w-5 h-5 mr-3">
            <ExternalLink className="w-full h-full" />
          </div>
          <span className="font-medium">Blog</span>
        </a>
        
        <NavLink 
          href="/about-us" 
          icon={<Info className="w-full h-full" />} 
          label="About Us" 
        />
        
        <NavLink 
          href="/subscription" 
          icon={<CreditCard className="w-full h-full" />} 
          label="Subscription" 
        />
        
        {/* Admin section - only visible to admins */}
        {user?.isAdmin && (
          <>
            <div className="px-6 py-3 mt-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Admin Area</span>
            </div>
            <NavLink 
              href="/admin" 
              icon={<ShieldAlert className="w-full h-full text-red-500" />} 
              label="Admin Dashboard" 
            />
          </>
        )}
        
        {/* Settings section with sub-navigation */}
        <div className={`${isSettingsActive || settingsExpanded ? "bg-gray-800" : ""}`}>
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={cn(
              "flex items-center px-6 py-3 w-full text-left text-gray-400 hover:bg-gray-800 hover:text-white transition-colors",
              (isSettingsActive || settingsExpanded) && "text-white"
            )}
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
          {(settingsExpanded || isSettingsActive) && (
            <div className="bg-gray-900 pb-2">
              <SubNavLink 
                href="/settings/profile" 
                icon={<UserCircle className="w-full h-full text-[#F5B8DB]" />} 
                label="Profile" 
              />
              <SubNavLink 
                href="/settings/password" 
                icon={<Lock className="w-full h-full text-[#9AAB63]" />} 
                label="Password" 
              />
              <SubNavLink 
                href="/settings/notifications" 
                icon={<Bell className="w-full h-full text-[#F5D867]" />} 
                label="Notifications" 
              />
              <SubNavLink 
                href="/settings/privacy" 
                icon={<Shield className="w-full h-full text-[#B6CAEB]" />} 
                label="Privacy" 
              />
              <SubNavLink 
                href="/settings/appearance" 
                icon={<Sun className="w-full h-full text-[#F5D867]" />} 
                label="Appearance" 
              />
              <SubNavLink 
                href="/settings/data" 
                icon={<Download className="w-full h-full text-[#F5B8DB]" />} 
                label="Data & Export" 
              />
            </div>
          )}
        </div>
        
        <div className="mt-auto p-4">
          <div className="rounded-xl bg-gray-800 p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
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