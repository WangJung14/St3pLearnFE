import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    const sizes = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-16 h-16 text-lg"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full flex items-center justify-center font-extrabold uppercase shrink-0 border border-white shadow-sm overflow-hidden",
          src && !hasError ? "bg-white" : "bg-gradient-to-tr from-primary to-secondary text-white",
          sizes[size],
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || fallback}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{fallback.substring(0, 1)}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
