import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window object is available (client-side)
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkIsMobile();

      // Add event listener for window resize
      window.addEventListener('resize', checkIsMobile);

      // Cleanup event listener on component unmount
      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }
  }, []);

  return isMobile;
}