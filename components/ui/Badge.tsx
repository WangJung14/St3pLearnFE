import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-pink-50 text-primary border-pink-100",
      secondary: "bg-blue-50 text-secondary border-blue-100",
      success: "bg-emerald-50 text-emerald-600 border-emerald-100",
      warning: "bg-amber-50 text-amber-600 border-amber-100",
      destructive: "bg-red-50 text-red-600 border-red-100",
      outline: "bg-white text-gray-500 border-gray-200"
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-4xs font-black uppercase tracking-wider transition-colors select-none",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
