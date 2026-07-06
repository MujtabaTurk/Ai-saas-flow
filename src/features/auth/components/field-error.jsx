"use client";

import { useTranslation } from "react-i18next";
import { translateLegacyText } from "@/i18n/legacy";
import { cn } from "@/lib/utils";

export function FieldError({ children, className, id }) {
  const { i18n } = useTranslation("legacy");

  if (!children) {
    return null;
  }

  return (
    <p
      className={cn("text-sm font-medium text-red-600", className)}
      id={id}
      role="alert"
    >
      {typeof children === "string" ? translateLegacyText(i18n, children) : children}
    </p>
  );
}
