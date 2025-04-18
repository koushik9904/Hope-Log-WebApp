import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Home, BookOpen, BarChart2, Settings, Plus } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();
  
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
          "flex flex-col items-center justify-center px-2",
          isActive ? "text-blue-600" : "text-gray-500"
        )}>
          <div className="w-6 h-6 mb-1">
            {icon}
          </div>
          <span className="text-xs font-medium">{label}</span>
        </a>
      </Link>
    );
  };
  
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          <NavLink href="/" icon={<Home className="w-full h-full" />} label="Home" />
          <NavLink href="/journal" icon={<BookOpen className="w-full h-full" />} label="Journal" />
          <NavLink href="/insights" icon={<BarChart2 className="w-full h-full" />} label="Insights" />
          <NavLink href="/settings" icon={<Settings className="w-full h-full" />} label="Settings" />
        </div>
      </nav>
      
      {/* Floating Action Button (mobile only) */}
      <button className="md:hidden fixed right-6 bottom-20 w-12 h-12 rounded-full voice-button shadow-lg flex items-center justify-center z-50">
        <Plus className="w-6 h-6 text-white" />
      </button>
    </>
  );
}
