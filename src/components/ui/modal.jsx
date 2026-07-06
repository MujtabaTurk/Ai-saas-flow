"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const modalSizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl"
};

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
  const { i18n } = useTranslation();

  return (
    <DialogPrimitive.Root
      dir={i18n.dir()}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isDismissDisabled) {
          return;
        }

        onOpenChange?.(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-growth-sidebar/45 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "modal-content fixed z-50 flex max-h-[calc(100dvh-2rem)] w-auto flex-col overflow-hidden rounded-xl border border-growth-border bg-white text-growth-sidebar shadow-2xl outline-none",
            modalSizes[size] || modalSizes.md,
            className
          )}
          onEscapeKeyDown={(event) => {
            if (isDismissDisabled) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            const originalEvent = event.detail?.originalEvent;
            const isFocusOutsideEvent = originalEvent?.type === "focusin";

            // Radix groups focus-outside with outside interactions; keep pointer
            // dismissals intact while ignoring unrelated focus churn.
            if (!closeOnOverlayClick || isDismissDisabled || isFocusOutsideEvent) {
              event.preventDefault();
            }
          }}
          onOpenAutoFocus={(event) => {
            if (initialFocusRef?.current) {
              event.preventDefault();
              initialFocusRef.current.focus();
            }
          }}
          onPointerDownOutside={(event) => {
            if (!closeOnOverlayClick || isDismissDisabled) {
              event.preventDefault();
            }
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-growth-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title ? (
                <DialogPrimitive.Title asChild>
                  <h2 className="text-lg font-bold leading-7">{title}</h2>
                </DialogPrimitive.Title>
              ) : null}
              {description ? (
                <DialogPrimitive.Description asChild>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                aria-label={closeLabel}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-growth-mint/40 hover:text-growth-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                disabled={isDismissDisabled}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
          {footer ? (
            <div className="border-t border-growth-border bg-growth-dashboard/80 px-5 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
        "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
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
