import React from "react";

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
      <div className={`${sizeMap[size].container} rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white relative overflow-hidden`}>
        {/* Cute avatar with simple facial features */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Face */}
            <div className="absolute inset-1 bg-white rounded-full opacity-90"></div>
            
            {/* Eyes */}
            <div className="absolute top-[35%] left-[30%] w-[15%] h-[15%] bg-blue-600 rounded-full"></div>
            <div className="absolute top-[35%] right-[30%] w-[15%] h-[15%] bg-blue-600 rounded-full"></div>
            
            {/* Smile */}
            <div className="absolute bottom-[35%] left-1/2 transform -translate-x-1/2 w-[40%] h-[10%] border-b-2 border-blue-600 rounded-b-full"></div>
          </div>
        </div>
        
        {/* Letter overlay */}
        <span className="relative z-10 font-bold text-white opacity-50">H</span>
      </div>
      
      {withText && (
        <h1 className={`font-['Nunito_Variable'] font-bold ${sizeMap[size].text} text-gray-800`}>
          Hope Log
        </h1>
      )}
    </div>
  );
}