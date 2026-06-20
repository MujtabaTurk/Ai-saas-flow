"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";

function ErrorDialog({
  actionLabel,
  description = "The request could not be completed. Please try again.",
  details,
  onAction,
  onOpenChange,
  open,
  title = "Something went wrong"
}) {
  return (
    <Modal
      closeOnOverlayClick
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title={title}
      footer={
        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
          {actionLabel && onAction ? (
            <Button type="button" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <AlertCircle aria-hidden="true" className="h-5 w-5" />
        </div>
        {details ? (
          <details className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <summary className="cursor-pointer font-semibold">
              Technical details
            </summary>
            <p className="mt-2 whitespace-pre-wrap break-words leading-6">
              {details}
            </p>
          </details>
        ) : null}
      </div>
    </Modal>
  );
}

export { ErrorDialog };
