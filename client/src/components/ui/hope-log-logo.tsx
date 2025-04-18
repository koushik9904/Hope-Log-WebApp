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
      <div className={`${sizeMap[size].container} rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white relative overflow-hidden shadow-md`}>
        {/* More playful cute avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-white opacity-10 rounded-full"></div>
            
            {/* Face */}
            <div className="absolute inset-[10%] bg-white rounded-full opacity-90"></div>
            
            {/* Blush */}
            <div className="absolute top-[48%] left-[22%] w-[12%] h-[8%] bg-pink-300 rounded-full opacity-70"></div>
            <div className="absolute top-[48%] right-[22%] w-[12%] h-[8%] bg-pink-300 rounded-full opacity-70"></div>
            
            {/* Eyes - cute anime style */}
            <div className="absolute top-[34%] left-[30%] w-[12%] h-[14%] bg-blue-600 rounded-full">
              <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white rounded-full opacity-80"></div>
            </div>
            <div className="absolute top-[34%] right-[30%] w-[12%] h-[14%] bg-blue-600 rounded-full">
              <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white rounded-full opacity-80"></div>
            </div>
            
            {/* Happy smile */}
            <div className="absolute bottom-[36%] left-1/2 transform -translate-x-1/2 w-[38%] h-[10%] border-b-[2.5px] border-blue-600 rounded-b-full"></div>
            
            {/* Ears */}
            <div className="absolute -top-[5%] left-[20%] w-[15%] h-[20%] bg-blue-400 rounded-full transform -rotate-12"></div>
            <div className="absolute -top-[5%] right-[20%] w-[15%] h-[20%] bg-blue-400 rounded-full transform rotate-12"></div>
          </div>
        </div>
      </div>
      
      {withText && (
        <h1 className={`font-['Nunito_Variable'] font-bold ${sizeMap[size].text} text-gray-800 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent`}>
          Hope Log
        </h1>
      )}
    </div>
  );
}