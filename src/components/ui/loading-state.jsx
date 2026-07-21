"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { translateLegacyText } from "@/i18n/legacy";

function LoadingState({
  title = "Loading",
  description = "Preparing your workspace...",
  className
}) {
  const { i18n } = useTranslation("legacy");
  const localizedTitle = translateLegacyText(i18n, title);
  const localizedDescription = translateLegacyText(i18n, description);

  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-sm",
        className
      )}
      role="status"
    >
      <div className="grid w-full max-w-sm gap-3" aria-hidden="true">
        <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
        <Skeleton className="mx-auto h-5 w-32" />
        <Skeleton className="mx-auto h-3 w-56 max-w-full" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-growth-sidebar">{localizedTitle}</h3>
      {localizedDescription ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {localizedDescription}
        </p>
      ) : null}
    </div>
  );
}

export { LoadingState };
