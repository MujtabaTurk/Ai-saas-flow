"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  languageCookieMaxAge,
  languageCookieName,
  languageStorageKey,
  getLanguageDirection,
  normalizeLanguageCode,
  supportedLanguages
} from "@/i18n/settings";
import { cn } from "@/lib/utils";

function persistLanguageSelection(language) {
  window.localStorage.setItem(languageStorageKey, language);
  document.cookie = `${languageCookieName}=${language}; Path=/; Max-Age=${languageCookieMaxAge}; SameSite=Lax`;
}

export function LanguageSwitcher({ align = "end", className = "" }) {
  const { i18n, t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const direction = getLanguageDirection(currentLanguage);
  const selectedLanguage = supportedLanguages.find(
    (language) => language.code === currentLanguage
  );

  async function selectLanguage(code) {
    const language = normalizeLanguageCode(code);

    persistLanguageSelection(language);
    await i18n.changeLanguage(language);
    setIsOpen(false);
  }

  return (
    <DropdownMenuPrimitive.Root dir={direction} open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("relative z-[70] inline-flex", className)}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            aria-label={t("language.choose")}
            className={cn(
              "inline-flex h-10 max-w-[12rem] items-center gap-2 rounded-lg border border-[#c7c4d8] bg-white/80 px-3 text-sm font-semibold text-[#0b1c30] shadow-sm backdrop-blur transition hover:border-[#3525cd]/35 hover:bg-[#eef4ff] hover:text-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f9ff]",
              isOpen && "border-[#3525cd]/45 bg-white text-[#3525cd]"
            )}
            type="button"
          >
            <Globe2 className="size-4 shrink-0" aria-hidden="true" />
            <span className="max-w-[6.25rem] truncate sm:max-w-[7.5rem]">
              {selectedLanguage?.name || currentLanguage}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-[#586377] transition-transform",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align={align}
            aria-label={t("language.available")}
            className="origin-top-inline-end z-[70] w-56 overflow-hidden rounded-lg border border-[#c7c4d8] bg-white py-1.5 text-[#0b1c30] shadow-2xl shadow-[#0b1c30]/15 outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
            sideOffset={8}
          >
            <DropdownMenuPrimitive.RadioGroup
              value={currentLanguage}
              onValueChange={(code) => {
                void selectLanguage(code);
              }}
            >
              {supportedLanguages.map((language) => {
                const isSelected = language.code === currentLanguage;

                return (
                  <DropdownMenuPrimitive.RadioItem
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-start text-sm font-medium transition hover:bg-[#eef4ff] focus:bg-[#eef4ff] focus:outline-none data-[highlighted]:bg-[#eef4ff] data-[highlighted]:outline-none",
                      isSelected && "bg-[#eef4ff] text-[#3525cd]"
                    )}
                    key={language.code}
                    value={language.code}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-[#3525cd] transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {language.nativeName}
                    </span>
                  </DropdownMenuPrimitive.RadioItem>
                );
              })}
            </DropdownMenuPrimitive.RadioGroup>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>

        <span className="sr-only" aria-live="polite">
          {selectedLanguage?.name || currentLanguage}
        </span>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}
