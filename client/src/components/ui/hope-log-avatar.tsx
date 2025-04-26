import React from "react";
import hopeLogAvatar from "@/assets/hope-log-avatar.png";

interface HopeLogAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HopeLogAvatar({ size = "md", className = "" }: HopeLogAvatarProps) {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  return (
    <div className={`rounded-full flex items-center justify-center overflow-hidden ${sizeMap[size]} ${className}`}>
      <img src={hopeLogAvatar} alt="Hope Log Avatar" className="w-full h-full object-cover" />
    </div>
  );
}