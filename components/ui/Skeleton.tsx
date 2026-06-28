import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "circle" | "rect" | "text";
}

export function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-150",
        variant === "circle" && "rounded-full",
        variant === "rect" && "rounded-2xl",
        variant === "text" && "h-3.5 w-full rounded-md my-1",
        className
      )}
      {...props}
    />
  );
}

// Pre-defined layout loaders
export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-4 shadow-soft">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-20 h-8" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 w-full">
      <div className="flex gap-4 items-center">
        <Skeleton variant="circle" className="w-16 h-16" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-48" />
          <Skeleton variant="text" className="w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}
