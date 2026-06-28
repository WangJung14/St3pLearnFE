"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  error: "border-red-100 bg-red-50 text-red-800",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  info: "border-blue-100 bg-blue-50 text-blue-800",
};

const iconStyles: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = cn("mt-0.5 h-5 w-5 shrink-0", iconStyles[variant]);

  if (variant === "success") return <CheckCircle2 className={className} />;
  if (variant === "error") return <XCircle className={className} />;
  if (variant === "warning") return <AlertCircle className={className} />;
  return <Info className={className} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const message: ToastMessage = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
    };

    setMessages((current) => [message, ...current].slice(0, 4));
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: "success" }),
      error: (title, description) => toast({ title, description, variant: "error" }),
      warning: (title, description) => toast({ title, description, variant: "warning" }),
      info: (title, description) => toast({ title, description, variant: "info" }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[360px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-gray-900/10 backdrop-blur transition-all",
              variantStyles[message.variant]
            )}
            role="status"
            aria-live="polite"
          >
            <ToastIcon variant={message.variant} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-extrabold leading-5">{message.title}</p>
              {message.description && (
                <p className="text-xs font-semibold leading-5 opacity-80">
                  {message.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(message.id)}
              className="rounded-full p-1 opacity-70 transition hover:bg-white/50 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
