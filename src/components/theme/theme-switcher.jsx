"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/providers/theme-provider";
import { switcherMenuStyles } from "@/components/ui/switcher-menu-styles";
import { cn } from "@/lib/utils";

export const THEME_OPTIONS = [
  {
    icon: Sun,
    labelKey: "theme.light",
    value: "light"
  },
  {
    icon: Moon,
    labelKey: "theme.dark",
    value: "dark"
  },
  {
    icon: Monitor,
    labelKey: "theme.system",
    value: "system"
  }
];

function getThemeOption(theme) {
  return (
    THEME_OPTIONS.find((option) => option.value === theme) ||
    THEME_OPTIONS[2]
  );
}

export function ThemeSwitcher({
  align = "end",
  className = "",
  compact = false
}) {
  const { i18n, t } = useTranslation("common");
  const { setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const selectedTheme = getThemeOption(theme);
  const SelectedIcon = selectedTheme.icon;

  function selectTheme(nextTheme) {
    setTheme(nextTheme);
    setIsOpen(false);
  }

  return (
    <DropdownMenuPrimitive.Root
      dir={i18n.dir()}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className={cn(switcherMenuStyles.root, className)}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            aria-label={t("theme.choose")}
            className={cn(
              switcherMenuStyles.trigger,
              compact && switcherMenuStyles.triggerCompact,
              isOpen && switcherMenuStyles.triggerOpen
            )}
            type="button"
          >
            <SelectedIcon className="size-4 shrink-0" aria-hidden="true" />
            <span
              className={cn(
                "max-w-[6.25rem] truncate sm:max-w-[7.5rem]",
                compact && "sr-only"
              )}
            >
              {t(selectedTheme.labelKey)}
            </span>
            <ChevronDown
              className={cn(
                switcherMenuStyles.chevron,
                compact && "hidden",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align={align}
            aria-label={t("theme.choose")}
            className={switcherMenuStyles.content}
            sideOffset={8}
          >
            <DropdownMenuPrimitive.RadioGroup
              value={theme}
              onValueChange={selectTheme}
            >
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === theme;

                return (
                  <DropdownMenuPrimitive.RadioItem
                    className={cn(
                      switcherMenuStyles.item,
                      isSelected && switcherMenuStyles.itemSelected
                    )}
                    key={option.value}
                    value={option.value}
                  >
                    <Check
                      className={cn(
                        switcherMenuStyles.check,
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                      aria-hidden="true"
                    />
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">
                      {t(option.labelKey)}
                    </span>
                  </DropdownMenuPrimitive.RadioItem>
                );
              })}
            </DropdownMenuPrimitive.RadioGroup>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>

        <span className="sr-only" aria-live="polite">
          {t(selectedTheme.labelKey)}
        </span>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}
