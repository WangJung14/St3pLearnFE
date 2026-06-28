import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider block">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:bg-gray-50",
            error && "border-red-500 bg-red-50/10 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-3xs text-red-500 font-bold">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
