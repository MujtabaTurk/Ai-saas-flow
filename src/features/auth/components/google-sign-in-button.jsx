"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      viewBox="0 0 18 18"
    >
      <path
        d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  className,
  clientId,
  disabled = false,
  isLoading = false,
  onClick,
}) {
  const { t } = useTranslation("auth");
  const isDisabled = disabled || isLoading;
  const label = isLoading ? t("login.googleSubmitting") : t("login.google");

  if (!clientId) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        aria-busy={isLoading || undefined}
        aria-label={label}
        disabled={isDisabled}
        className={cn(
          "grid h-11 w-full grid-cols-[1fr_auto_1fr] items-center rounded-[8px] border border-[#d7dce7] bg-white px-4 text-sm font-semibold text-[#1f2937] shadow-none transition-colors",
          "hover:border-[#b8c0cf] hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/25",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
        onClick={() => {
          if (!isDisabled) {
            void onClick?.();
          }
        }}
      >
        <span className="col-start-2 inline-flex min-w-0 items-center justify-center gap-3">
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-[#586377]" aria-hidden="true" />
          ) : (
            <GoogleLogo />
          )}
          <span className="truncate">{label}</span>
        </span>
      </button>
    </div>
  );
}
