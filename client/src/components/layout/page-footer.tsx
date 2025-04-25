import { Link, useLocation } from "wouter";
import { FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { platformLinks, resourceLinks, legalLinks, socialLinks } from "@/lib/navigation";
import { ExternalLink } from "lucide-react";

export function PageFooter() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  
  // Function to check if a link is an anchor link
  const isAnchorLink = (href: string): boolean => {
    return href.startsWith("#");
  };
  
  // Function to get proper href for anchor links
  const getAnchorLinkHref = (href: string): string => {
    return "/" + href; // Always redirect to home page with anchor
  };

  // Function to render social media icons based on type
  const renderSocialIcon = (icon: string, size: number = 20) => {
    switch (icon) {
      case 'twitter':
        return <FaTwitter size={size} />;
      case 'instagram':
        return <FaInstagram size={size} />;
      case 'facebook':
        return <FaFacebook size={size} />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <HopeLogLogo size="md" withText className="mb-4" />
            <p className="text-gray-400 mb-4">
              Your companion for mental wellness journaling and personal growth.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-[#F5B8DB]"
                  aria-label={social.label}
                >
                  {renderSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Platform</h3>
            <ul className="space-y-2">
              {platformLinks.map((link, index) => (
                <li key={index}>
                  {link.isExternal ? (
                    <a 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-white flex items-center"
                    >
                      {link.label}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : isAnchorLink(link.href) ? (
                    <a
                      href={getAnchorLinkHref(link.href)}
                      className="text-gray-400 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-400 hover:text-white">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  {link.isExternal ? (
                    <a 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-white flex items-center"
                    >
                      {link.label}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : isAnchorLink(link.href) ? (
                    <a
                      href={getAnchorLinkHref(link.href)}
                      className="text-gray-400 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-400 hover:text-white">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  {isAnchorLink(link.href) ? (
                    <a
                      href={getAnchorLinkHref(link.href)}
                      className="text-gray-400 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-400 hover:text-white">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500">
            &copy; {currentYear} Hope Log. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}