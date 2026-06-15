"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PasswordInput({
  className,
  disabled,
  hidePasswordLabel,
  id,
  showPasswordLabel,
  ...props
}) {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);
  const toggleLabel = isVisible
    ? hidePasswordLabel || t("actions.hidePassword")
    : showPasswordLabel || t("actions.showPassword");
  const VisibilityIcon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn("pe-12", className)}
      />
      <button
        type="button"
        className="absolute end-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-growth-mint/40 hover:text-growth-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        aria-controls={id}
        aria-label={toggleLabel}
        aria-pressed={isVisible}
        disabled={disabled}
        title={toggleLabel}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        <VisibilityIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export { PasswordInput };
