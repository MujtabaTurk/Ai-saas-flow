"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { translateLegacyText } from "@/i18n/legacy";

function ErrorState({
  title = "Something went wrong",
  description = "ServiceFlow could not finish this request.",
  actionLabel = "Try again",
  onAction,
  action,
  className
}) {
  const { i18n } = useTranslation("legacy");
  const localizedTitle = translateLegacyText(i18n, title);
  const localizedDescription = translateLegacyText(i18n, description);
  const localizedActionLabel = translateLegacyText(i18n, actionLabel);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[hsl(var(--error-border))] bg-[hsl(var(--error-bg))] p-8 text-center text-[hsl(var(--error-foreground))]",
        className
      )}
      role="alert"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-lg font-bold text-[hsl(var(--error-foreground))]">
        !
      </div>
      <h3 className="text-lg font-bold">{localizedTitle}</h3>
      {localizedDescription ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[hsl(var(--error-foreground))]">
          {localizedDescription}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5">{action}</div>
      ) : onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {localizedActionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
