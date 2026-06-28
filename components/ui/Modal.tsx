import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  // Prevent background scrolling when open
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-[2400px]:p-12">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content wrapper */}
      <div
        className={cn(
          "app-modal-panel relative z-50 flex max-h-[85vh] flex-col rounded-3xl border border-gray-100 bg-white shadow-2xl animate-fade-in",
          className
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-50 px-6 py-4">
          {title ? (
            <h3 className="min-w-0 text-base font-extrabold leading-snug text-gray-900">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-primary transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6 text-xs leading-relaxed text-gray-600">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 justify-end gap-3 rounded-b-3xl border-t border-gray-50 bg-gray-50/40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
