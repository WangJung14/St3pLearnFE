import React from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-gray-100 shadow-soft py-16 px-6 text-center space-y-4 max-w-lg mx-auto w-full min-w-[320px] sm:min-w-[400px] flex flex-col items-center justify-center animate-fade-in",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-pink-50/50 text-primary flex items-center justify-center shadow-inner border border-pink-100/30">
        {icon || <HelpCircle className="w-8 h-8" />}
      </div>
      <div className="space-y-1.5">
        <h4 className="font-extrabold text-gray-900 text-base leading-none">{title}</h4>
        <p className="text-xs text-gray-500 max-w-xs mx-auto min-w-[320px] sm:min-w-[400px] leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
