import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-4xs font-black uppercase tracking-wider rounded-lg shadow-md z-50 whitespace-nowrap pointer-events-none animate-fade-in",
            className
          )}
        >
          {content}
          <div className="w-2 h-2 bg-slate-900 absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
