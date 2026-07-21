"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { translateLegacyText } from "@/i18n/legacy";

function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  className
}) {
  const { i18n } = useTranslation("legacy");
  const localizedTitle = translateLegacyText(i18n, title);
  const localizedDescription = translateLegacyText(i18n, description);

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-growth-mint text-lg font-bold text-growth-sidebar">
        SF
      </div>
      <h3 className="text-lg font-bold text-growth-sidebar">{localizedTitle}</h3>
      {localizedDescription ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {localizedDescription}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
