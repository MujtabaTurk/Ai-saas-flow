"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const modalSizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl"
};

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(focusableSelector)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
  );
}

function Modal({
  children,
  className,
  closeLabel = "Close dialog",
  closeOnOverlayClick = true,
  description,
  footer,
  initialFocusRef,
  isDismissDisabled = false,
  onOpenChange,
  open,
  size = "md",
  title
}) {
  const contentRef = useRef(null);
  const isDismissDisabledRef = useRef(isDismissDisabled);
  const onOpenChangeRef = useRef(onOpenChange);
  const previousActiveElementRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    isDismissDisabledRef.current = isDismissDisabled;
    onOpenChangeRef.current = onOpenChange;
  }, [isDismissDisabled, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocusRef?.current || getFocusableElements(contentRef.current)[0];
      target?.focus?.();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isDismissDisabledRef.current) {
        event.preventDefault();
        onOpenChangeRef.current?.(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(contentRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [initialFocusRef, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      className="fixed inset-0 z-50 flex min-h-dvh items-end justify-center overflow-y-auto bg-growth-sidebar/45 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8"
      role="dialog"
      onMouseDown={(event) => {
        if (
          closeOnOverlayClick &&
          !isDismissDisabled &&
          event.target === event.currentTarget
        ) {
          onOpenChange?.(false);
        }
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          "relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-growth-border bg-white text-growth-sidebar shadow-2xl outline-none",
          modalSizes[size] || modalSizes.md,
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-growth-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-lg font-bold leading-7">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-6 text-muted-foreground"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label={closeLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-growth-mint/40 hover:text-growth-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            disabled={isDismissDisabled}
            type="button"
            onClick={() => onOpenChange?.(false)}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-growth-border bg-growth-dashboard/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModalFooter({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function ModalError({ className, children, ...props }) {
  if (!children) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export { Modal, ModalError, ModalFooter };
