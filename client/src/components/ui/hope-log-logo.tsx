import React from "react";
import hopeLogLogo from "@/assets/hope-log-logo.png";

interface HopeLogLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}

export function HopeLogLogo({ size = "md", withText = false, className = "" }: HopeLogLogoProps) {
  const sizeMap = {
    sm: { container: "w-8 h-8", text: "text-base ml-1.5" },
    md: { container: "w-10 h-10", text: "text-xl ml-2" },
    lg: { container: "w-12 h-12", text: "text-2xl ml-3" }
  };

  // Size for the logo itself needs to be larger since it contains both icon and text
  const logoSizeMap = {
    sm: "w-36 h-14",
    md: "w-56 h-20",
    lg: "w-72 h-24"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${logoSizeMap[size]} flex items-center justify-center relative`}>
        <img src={hopeLogLogo} alt="Hope Log" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}