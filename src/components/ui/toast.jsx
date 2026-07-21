"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateLegacyText } from "@/i18n/legacy";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-growth-border bg-card text-card-foreground",
    iconClassName: "text-primary"
  },
  info: {
    icon: Info,
    className: "border-growth-border bg-card text-card-foreground",
    iconClassName: "text-growth-forest"
  },
  error: {
    icon: AlertCircle,
    className: "border-[hsl(var(--error-border))] bg-[hsl(var(--error-bg))] text-[hsl(var(--error-foreground))]",
    iconClassName: "text-[hsl(var(--error-foreground))]"
  }
};

function ToastProvider({ children }) {
  const { i18n } = useTranslation("legacy");
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
        className="i18n-toast-viewport fixed top-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:top-6"
        role="status"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.variant] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              className={cn(
                "flex gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
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
                  <p className="font-semibold leading-5">
                    {typeof toast.title === "string"
                      ? translateLegacyText(i18n, toast.title)
                      : toast.title}
                  </p>
                ) : null}
                {toast.description ? (
                  <p className="mt-1 leading-5 text-muted-foreground">
                    {typeof toast.description === "string"
                      ? translateLegacyText(i18n, toast.description)
                      : toast.description}
                  </p>
                ) : null}
              </div>
              <button
                aria-label={translateLegacyText(i18n, "Dismiss notification")}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
