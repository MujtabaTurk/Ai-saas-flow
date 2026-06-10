"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function Error({ error, reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <ErrorState
        className="w-full max-w-md"
        description={error?.message || "ServiceFlow could not finish this request."}
        onAction={reset}
      />
    </main>
  );
}
