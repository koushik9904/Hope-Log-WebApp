import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  
  const NavLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = location === href;
    
    return (
      <Link href={href}>
        <a className={cn(
          "flex flex-col items-center justify-center",
          isActive ? "text-primary" : "text-neutral-medium"
        )}>
          <i className={`${icon} text-xl`}></i>
          <span className="text-xs mt-1">{label}</span>
        </a>
      </Link>
    );
  };
  
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          <NavLink href="/" icon="ri-home-5-line" label="Home" />
          <NavLink href="/journal" icon="ri-book-line" label="Journal" />
          <NavLink href="/insights" icon="ri-line-chart-line" label="Insights" />
          <NavLink href="/settings" icon="ri-settings-3-line" label="Settings" />
        </div>
      </nav>
      
      {/* Floating Action Button (mobile only) */}
      <button className="md:hidden fixed right-6 bottom-20 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-50">
        <i className="ri-add-line text-2xl"></i>
      </button>
    </>
  );
}
