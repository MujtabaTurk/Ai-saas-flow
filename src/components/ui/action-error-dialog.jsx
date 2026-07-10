"use client";

import { ErrorDialog } from "@/components/ui/error-dialog";

export function ActionErrorDialog({ error, onClear }) {
  return (
    <ErrorDialog
      description={error?.description}
      details={error?.details}
      open={Boolean(error)}
      title={error?.title}
      onOpenChange={(open) => {
        if (!open) {
          onClear?.();
        }
      }}
    />
  );
}
