import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { ExternalLink, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { NavLink, primaryNavLinks } from "@/lib/navigation";

interface PageHeaderProps {
  currentPage: string;
  navLinks?: NavLink[];
  logoSize?: "sm" | "md" | "lg";
}

export function PageHeader({ 
  currentPage, 
  navLinks = primaryNavLinks,
  logoSize = "md"
}: PageHeaderProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  // Function to check if a link is active based on the current page or URL
  const isLinkActive = (link: NavLink): boolean => {
    // Handle home page special case
    if (link.href === "/" && currentPage === "home") {
      return true;
    }
    
    // Handle anchor links (they should be active when on landing page)
    if (link.href.startsWith("#") && location === "/") {
      return false; // Don't highlight as active, but they work when clicked
    }
    
    // For regular pages, check if the current page matches the link href
    if (link.href !== "/" && !link.href.startsWith("#") && !link.isExternal) {
      return currentPage === link.href.replace("/", "");
    }
    
    return false;
  };
  
  // Function to get the proper href for navigation
  const getProperHref = (link: NavLink): string => {
    // If it's an anchor link and we're not on the home page, redirect to home first
    if (link.href.startsWith("#") && location !== "/") {
      return "/" + link.href; // Prepend with "/" to make it go to the homepage with anchor
    }
    return link.href;
  };
  
  // Function to determine if we should use an anchor tag instead of Link
  const isAnchorLink = (link: NavLink): boolean => {
    return link.href.startsWith("#");
  };
  
  // Get the proper href for anchor links, ensuring they always go to the homepage section
  const getAnchorLinkHref = (href: string): string => {
    // Always prepend with "/" to ensure it navigates to the homepage first
    return "/" + href;
  };

  return (
    <nav className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap justify-between items-center">
          {/* Logo and Mobile Auth Section */}
          <div className="flex items-center justify-between w-full md:w-auto">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <HopeLogLogo size="sm" withText className="md:hidden" />
                <HopeLogLogo size={logoSize} withText className="hidden md:block" />
              </div>
            </Link>
            
            {/* Mobile Auth Buttons - inline with logo */}
            <div className="flex md:hidden items-center space-x-2">
              {user ? (
                <Link 
                  href="/" 
                  className="pi-button text-center text-xs py-1.5 px-3"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth" 
                    className="px-3 py-1.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors text-xs text-center"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth?tab=register" 
                    className="pi-button text-xs py-1.5 px-3 text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className="p-1 ml-2"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-800" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-800" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => {
              // Filter out Features, Pricing, and Testimonials links on tablet-sized screens (md)
              // These are available in the footer and help with responsiveness
              if ((link.label === "Features" || link.label === "Pricing" || link.label === "Testimonials") &&
                  !link.isExternal) {
                // Use anchor tag for anchor links on tablet and above
                if (isAnchorLink(link)) {
                  return (
                    <a 
                      key={index}
                      href={getAnchorLinkHref(link.href)}
                      className={`${
                        isLinkActive(link)
                          ? "text-[#F5B8DB] font-medium" 
                          : "text-gray-600"
                      } hover:text-gray-900 hidden lg:inline-block`}
                    >
                      {link.label}
                    </a>
                  );
                }
                
                return (
                  <Link 
                    key={index}
                    href={getProperHref(link)} 
                    className={`${
                      isLinkActive(link)
                        ? "text-[#F5B8DB] font-medium" 
                        : "text-gray-600"
                    } hover:text-gray-900 hidden lg:inline-block`}
                  >
                    {link.label}
                  </Link>
                );
              }
              
              // External links use anchor tags
              if (link.isExternal) {
                return (
                  <a 
                    key={index}
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    {link.label}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                );
              }
              
              // Anchor links use anchor tags
              if (isAnchorLink(link)) {
                return (
                  <a 
                    key={index}
                    href={getAnchorLinkHref(link.href)}
                    className={`${
                      isLinkActive(link)
                        ? "text-[#F5B8DB] font-medium" 
                        : "text-gray-600"
                    } hover:text-gray-900`}
                  >
                    {link.label}
                  </a>
                );
              }
              
              // Regular links use Wouter Link
              return (
                <Link 
                  key={index}
                  href={link.href} 
                  className={`${
                    isLinkActive(link)
                      ? "text-[#F5B8DB] font-medium" 
                      : "text-gray-600"
                  } hover:text-gray-900`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <Link href="/" className="pi-button text-sm sm:text-base whitespace-nowrap">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth" 
                  className="px-2 py-2 md:px-3 lg:px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  Login
                </Link>
                <Link 
                  href="/auth?tab=register" 
                  className="pi-button text-sm sm:text-base whitespace-nowrap px-2 md:px-3 lg:px-4"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link, index) => {
                // External links
                if (link.isExternal) {
                  return (
                    <a 
                      key={index}
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-gray-900 flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  );
                }
                
                // Anchor links
                if (isAnchorLink(link)) {
                  return (
                    <a 
                      key={index}
                      href={getAnchorLinkHref(link.href)}
                      className={`${
                        isLinkActive(link)
                          ? "text-[#F5B8DB] font-medium" 
                          : "text-gray-600"
                      } hover:text-gray-900`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  );
                }
                
                // Regular links
                return (
                  <Link 
                    key={index}
                    href={link.href} 
                    className={`${
                      isLinkActive(link)
                        ? "text-[#F5B8DB] font-medium" 
                        : "text-gray-600"
                    } hover:text-gray-900`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}