"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function isDashboardRoute(url) {
  return url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin");
}

export function DashboardRouteProgress() {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setIsPending(false);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [pathname]);

  useEffect(() => {
    if (!isPending) {
      return undefined;
    }

    const visibleTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 160);
    const safetyTimer = window.setTimeout(() => {
      setIsPending(false);
    }, 8000);

    return () => {
      window.clearTimeout(visibleTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [isPending]);

  useEffect(() => {
    function handleClick(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest?.("a[href]");

      if (!link || link.target || link.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (
        nextUrl.origin !== currentUrl.origin ||
        !isDashboardRoute(nextUrl) ||
        `${nextUrl.pathname}${nextUrl.search}` ===
          `${currentUrl.pathname}${currentUrl.search}`
      ) {
        return;
      }

      setIsPending(true);
      setIsVisible(false);
    }

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden bg-transparent transition-opacity duration-150",
        isPending && isVisible ? "opacity-100" : "opacity-0"
      )}
      aria-hidden="true"
    >
      <div className="h-full w-1/3 animate-route-progress rounded-full bg-primary shadow-[0_0_18px_rgba(53,37,205,0.45)]" />
    </div>
  );
}
