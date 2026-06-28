import React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-2xs font-extrabold uppercase text-gray-400 tracking-wider block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full text-xs rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all cursor-pointer disabled:opacity-50",
            error && "border-red-500 bg-red-50/10 focus:ring-red-500",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-3xs text-red-500 font-bold">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
