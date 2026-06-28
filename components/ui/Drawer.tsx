import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({ isOpen, onClose, title, children, footer, className }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out drawer content */}
      <div
        className={cn(
          "bg-white h-full w-full max-w-md relative flex flex-col z-50 border-l border-gray-100 shadow-2xl animate-slide-in-right",
          className
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50">
          {title ? (
            <h3 className="text-base font-extrabold text-gray-900 leading-none">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-primary transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow p-6 overflow-y-auto text-xs text-gray-600 leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-gray-50 bg-gray-50/40 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
