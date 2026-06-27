"use client";

import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const MAX_BUTTON_WIDTH = 400;
const DEFAULT_BUTTON_WIDTH = 400;

function getGoogleTheme() {
  if (typeof document === "undefined") {
    return "outline";
  }

  return document.documentElement.classList.contains("dark")
    ? "filled_black"
    : "outline";
}

function normalizeLocale(locale) {
  if (!locale || typeof locale !== "string") {
    return undefined;
  }

  return locale.replace("-", "_");
}

function getButtonWidth(element) {
  if (!element) {
    return DEFAULT_BUTTON_WIDTH;
  }

  const width = Math.floor(element.getBoundingClientRect().width);

  if (!width || width < 1) {
    return DEFAULT_BUTTON_WIDTH;
  }

  return Math.min(width, MAX_BUTTON_WIDTH);
}

function subscribeToThemeChanges(onStoreChange) {
  if (
    typeof document === "undefined" ||
    typeof MutationObserver === "undefined"
  ) {
    return () => {};
  }

  const observer = new MutationObserver(onStoreChange);

  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true
  });

  return () => observer.disconnect();
}

export function GoogleSignInButton({
  className,
  clientId,
  disabled = false,
  onClick,
  text = "continue_with"
}) {
  const { i18n, t } = useTranslation("auth");
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const disabledRef = useRef(disabled);
  const onClickRef = useRef(onClick);
  const [buttonWidth, setButtonWidth] = useState(DEFAULT_BUTTON_WIDTH);
  const buttonTheme = useSyncExternalStore(
    subscribeToThemeChanges,
    getGoogleTheme,
    () => "outline"
  );
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      const nextWidth = getButtonWidth(element);

      setButtonWidth((currentWidth) => (
        currentWidth === nextWidth ? currentWidth : nextWidth
      ));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);

      return () => window.removeEventListener("resize", updateWidth);
    }

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const target = buttonRef.current;
    const googleAccounts = window.google?.accounts?.id;

    if (
      !clientId ||
      !scriptReady ||
      !target ||
      !googleAccounts
    ) {
      if (target) {
        target.replaceChildren();
      }

      return undefined;
    }

    target.replaceChildren();

    try {
      googleAccounts.initialize({
        auto_select: false,
        callback: () => {
          // Authentication remains delegated to the existing NextAuth OAuth flow.
        },
        client_id: clientId
      });

      googleAccounts.renderButton(target, {
        click_listener: () => {
          if (!disabledRef.current) {
            void onClickRef.current?.();
          }
        },
        locale,
        logo_alignment: "center",
        shape: "pill",
        size: "large",
        text,
        theme: buttonTheme,
        type: "standard",
        width: String(buttonWidth)
      });
    } catch {
      window.setTimeout(() => setScriptFailed(true), 0);
    }

    return () => target.replaceChildren();
  }, [
    buttonTheme,
    buttonWidth,
    clientId,
    locale,
    scriptReady,
    text
  ]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={cn("mx-auto w-full max-w-[400px] space-y-2", className)}>
      <Script
        id="google-identity-services"
        src={GIS_SCRIPT_SRC}
        strategy="afterInteractive"
        onError={() => setScriptFailed(true)}
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />

      <div
        ref={containerRef}
        aria-disabled={disabled || undefined}
        className={cn(
          "grid h-11 w-full place-items-center",
          disabled ? "pointer-events-none opacity-60" : null
        )}
      >
        <div
          ref={buttonRef}
          className="grid min-h-10 w-full place-items-center overflow-hidden"
          aria-busy={!scriptReady || undefined}
        />
      </div>

      {scriptFailed ? (
        <p className="text-center text-xs text-muted-foreground" role="alert">
          {t("login.authenticationError")}
        </p>
      ) : null}
    </div>
  );
}
