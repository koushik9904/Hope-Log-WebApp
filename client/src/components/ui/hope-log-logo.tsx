import React from "react";
import hopeLogLogo from "@/assets/hope-log-logo.png";

interface HopeLogLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}

export function HopeLogLogo({ size = "md", withText = true, className = "" }: HopeLogLogoProps) {
  const sizeMap = {
    sm: { container: "w-8 h-8", text: "text-base ml-1.5" },
    md: { container: "w-10 h-10", text: "text-xl ml-2" },
    lg: { container: "w-12 h-12", text: "text-2xl ml-3" }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeMap[size].container} flex items-center justify-center relative`}>
        <img src={hopeLogLogo} alt="Hope Log" className="w-full h-full object-contain" />
      </div>
      
      {withText && (
        <h1 className={`font-['Nunito_Variable'] font-bold ${sizeMap[size].text} text-[#CB3B8C]`}>
          Hope Log
        </h1>
      )}
    </div>
  );
}