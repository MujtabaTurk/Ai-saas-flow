"use client";

import { CircleAlert, Info, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalError, ModalFooter } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const dialogIntents = {
  default: {
    Icon: Info,
    className: "bg-growth-mint/70 text-growth-forest ring-growth-border"
  },
  destructive: {
    Icon: Trash2,
    className: "bg-red-50 text-red-700 ring-red-100"
  },
  warning: {
    Icon: TriangleAlert,
    className: "bg-amber-50 text-amber-700 ring-amber-100"
  },
  error: {
    Icon: CircleAlert,
    className: "bg-red-50 text-red-700 ring-red-100"
  }
};

function resolveIntent(intent, variant) {
  if (intent && dialogIntents[intent]) {
    return intent;
  }

  return variant === "destructive" ? "destructive" : "default";
}

function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  error,
  icon: IconOverride,
  intent,
  isLoading = false,
  loadingLabel,
  onConfirm,
  onOpenChange,
  open,
  showIcon = true,
  title,
  variant = "destructive"
}) {
  const hasError = Boolean(error);
  const resolvedIntent = hasError ? "error" : resolveIntent(intent, variant);
  const iconConfig = dialogIntents[resolvedIntent] || dialogIntents.default;
  const Icon = hasError ? iconConfig.Icon : IconOverride || iconConfig.Icon;

  return (
    <Modal
      closeOnOverlayClick={!isLoading}
      description={description}
      isDismissDisabled={isLoading}
      onOpenChange={onOpenChange}
      open={open}
      size="sm"
      title={title}
      footer={
        <ModalFooter>
          <Button
            disabled={isLoading}
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            disabled={isLoading}
            isLoading={isLoading}
            loadingLabel={loadingLabel || "Working..."}
            type="button"
            variant={variant}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {showIcon ? (
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
              iconConfig.className
            )}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
        ) : null}
        <ModalError>{error}</ModalError>
      </div>
    </Modal>
  );
}

export { ConfirmationDialog };
