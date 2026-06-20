"use client";

import { useEffect, useRef, useState } from "react";
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
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const currentLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const selectedLanguage = supportedLanguages.find(
    (language) => language.code === currentLanguage
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function selectLanguage(code) {
    const language = normalizeLanguageCode(code);

    persistLanguageSelection(language);
    await i18n.changeLanguage(language);
    setIsOpen(false);
    triggerRef.current?.focus();
    router.refresh();
  }

  function focusItem(index) {
    itemRefs.current[index]?.focus();
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);

      requestAnimationFrame(() => {
        const selectedIndex = supportedLanguages.findIndex(
          (language) => language.code === currentLanguage
        );

        focusItem(
          event.key === "ArrowUp"
            ? supportedLanguages.length - 1
            : Math.max(selectedIndex, 0)
        );
      });
    }
  }

  function handleMenuKeyDown(event, index) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem((index + 1) % supportedLanguages.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem((index - 1 + supportedLanguages.length) % supportedLanguages.length);
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusItem(supportedLanguages.length - 1);
    }
  }

  return (
    <div
      className={cn("fixed right-4 top-4 z-[70] sm:right-6", className)}
      ref={rootRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Choose app locale"
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full border border-growth-border bg-white/90 text-growth-sidebar shadow-lg shadow-emerald-950/10 backdrop-blur transition hover:border-primary hover:bg-growth-mint/40 hover:text-growth-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isOpen && "border-primary bg-white text-growth-forest"
        )}
        onClick={() => setIsOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
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

      {isOpen ? (
        <div
          aria-label="Available locales"
          className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-2xl border border-growth-border bg-white py-1.5 text-growth-sidebar shadow-2xl shadow-emerald-950/15 outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
          role="menu"
        >
          {supportedLanguages.map((language, index) => {
            const isSelected = language.code === currentLanguage;

            return (
              <button
                aria-checked={isSelected}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-growth-mint/35 focus:bg-growth-mint/45 focus:outline-none",
                  isSelected && "bg-growth-mint/45 text-growth-forest"
                )}
                key={language.code}
                onClick={() => {
                  void selectLanguage(language.code);
                }}
                onKeyDown={(event) => handleMenuKeyDown(event, index)}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                role="menuitemradio"
                tabIndex={0}
                type="button"
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
              </button>
            );
          })}
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {selectedLanguage?.name || currentLanguage}
      </span>
    </div>
  );
}
