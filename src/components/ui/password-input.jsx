"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function PasswordInput({
  className,
  disabled,
  hidePasswordLabel,
  id,
  leadingIcon: LeadingIcon,
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
      {LeadingIcon ? (
        <LeadingIcon
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
      <Input
        {...props}
        id={id}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn(LeadingIcon ? "ps-10" : null, "pe-12", className)}
      />
      <Tooltip content={toggleLabel}>
        <button
          type="button"
          className="absolute end-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-[#eef4ff] hover:text-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          aria-controls={id}
          aria-label={toggleLabel}
          aria-pressed={isVisible}
          disabled={disabled}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          <VisibilityIcon className="size-4" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

export { PasswordInput };
