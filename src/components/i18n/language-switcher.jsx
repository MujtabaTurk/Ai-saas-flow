"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  languageCookieMaxAge,
  languageCookieName,
  languageStorageKey,
  normalizeLanguageCode,
  supportedLanguages
} from "@/i18n/settings";
import { cn } from "@/lib/utils";

function persistLanguageSelection(language) {
  window.localStorage.setItem(languageStorageKey, language);
  document.cookie = `${languageCookieName}=${language}; Path=/; Max-Age=${languageCookieMaxAge}; SameSite=Lax`;
}

export function LanguageSwitcher({ className = "" }) {
  const { i18n } = useTranslation("common");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const selectedLanguage = supportedLanguages.find(
    (language) => language.code === currentLanguage
  );

  async function selectLanguage(code) {
    const language = normalizeLanguageCode(code);

    persistLanguageSelection(language);
    await i18n.changeLanguage(language);
    setIsOpen(false);
    router.refresh();
  }

  return (
    <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn("fixed right-4 top-4 z-[70] sm:right-6", className)}
      >
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            aria-label="Choose app locale"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full border border-growth-border bg-white/90 text-growth-sidebar shadow-lg shadow-emerald-950/10 backdrop-blur transition hover:border-primary hover:bg-growth-mint/40 hover:text-growth-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isOpen && "border-primary bg-white text-growth-forest"
            )}
            type="button"
          >
            <Globe2 className="size-5" aria-hidden="true" />
            <ChevronDown
              className={cn(
                "absolute bottom-1 right-1 size-3 rounded-full bg-white text-growth-forest transition-transform",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            aria-label="Available locales"
            className="z-[70] w-52 origin-top-right overflow-hidden rounded-2xl border border-growth-border bg-white py-1.5 text-growth-sidebar shadow-2xl shadow-emerald-950/15 outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
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
                      "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-growth-mint/35 focus:bg-growth-mint/45 focus:outline-none data-[highlighted]:bg-growth-mint/45 data-[highlighted]:outline-none",
                      isSelected && "bg-growth-mint/45 text-growth-forest"
                    )}
                    key={language.code}
                    value={language.code}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{language.nativeName}</span>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {language.code}
                      </span>
                    </span>
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-primary transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                      aria-hidden="true"
                    />
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
