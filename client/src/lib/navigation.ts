export type NavLink = {
  label: string;
  href: string;
  isExternal: boolean;
};

// Primary navigation links for the main header
export const primaryNavLinks: NavLink[] = [
  { label: "Features", href: "#features", isExternal: false },
  { label: "Pricing", href: "#pricing", isExternal: false },
  { label: "Testimonials", href: "#testimonials", isExternal: false },
  { label: "Blog", href: "https://jazeeljabbar.substack.com/", isExternal: true },
  { label: "About Us", href: "/about-us", isExternal: false }
];

// Footer navigation - Platform section
export const platformLinks = [
  { label: "Home", href: "/", isExternal: false },
  { label: "About Us", href: "/about-us", isExternal: false },
  { label: "Features", href: "#features", isExternal: false },
  { label: "Pricing", href: "#pricing", isExternal: false },
  { label: "Community", href: "/community", isExternal: false },
];

// Footer navigation - Resources section
export const resourceLinks = [
  { label: "Mental Health Resources", href: "/mental-health-resources", isExternal: false },
  { label: "Help Center", href: "/help-center", isExternal: false },
  { label: "Blog", href: "https://jazeeljabbar.substack.com/", isExternal: true },
];

// Footer navigation - Legal section
export const legalLinks = [
  { label: "Terms of Service", href: "/terms-of-service", isExternal: false },
  { label: "Privacy Policy", href: "/privacy-policy", isExternal: false },
];

// Social media links
export const socialLinks = [
  { label: "Twitter", href: "https://twitter.com/jazeelaj", icon: "twitter" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
];