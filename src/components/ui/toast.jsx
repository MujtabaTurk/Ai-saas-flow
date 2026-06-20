"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-growth-border bg-white text-growth-sidebar",
    iconClassName: "text-primary"
  },
  info: {
    icon: Info,
    className: "border-growth-border bg-white text-growth-sidebar",
    iconClassName: "text-growth-forest"
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-white text-red-800",
    iconClassName: "text-red-600"
  }
};

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ description, duration = 5000, title, variant = "success" }) => {
      const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((current) => [
        ...current,
        { description, id, title, variant }
      ]);

      if (duration !== Infinity) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ dismissToast, showToast }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 top-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
        role="status"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.variant] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              className={cn(
                "flex gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl",
                style.className
              )}
              key={toast.id}
            >
              <Icon
                aria-hidden="true"
                className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconClassName)}
              />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <p className="font-semibold leading-5">{toast.title}</p>
                ) : null}
                {toast.description ? (
                  <p className="mt-1 leading-5 text-muted-foreground">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="Dismiss notification"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-growth-mint/40 hover:text-growth-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                onClick={() => dismissToast(toast.id)}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

export { ToastProvider, useToast };
