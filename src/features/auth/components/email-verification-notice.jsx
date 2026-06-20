"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function EmailVerificationNotice() {
  const [status, setStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);

  async function resendVerification() {
    setIsSending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/email-verification", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      setStatus({
        type: response.ok ? "success" : "error",
        message:
          payload?.data?.message ||
          payload?.error?.message ||
          "Could not send verification email.",
        devVerificationUrl:
          payload?.data?.devVerificationUrl ||
          payload?.error?.details?.devVerificationUrl ||
          null
      });
    } catch {
      setStatus({
        type: "error",
        message: "Could not send verification email."
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Verify your email</p>
          <p className="mt-1 text-amber-800">
            Verify your email to connect booking history for this address.
          </p>
        </div>
        <Button
          disabled={isSending}
          type="button"
          variant="outline"
          onClick={resendVerification}
        >
          {isSending ? "Sending..." : "Send link"}
        </Button>
      </div>
      {status ? (
        <div
          aria-live="polite"
          className={
            status.type === "error"
              ? "mt-3 text-red-700"
              : "mt-3 text-growth-sidebar"
          }
        >
          <p>{status.message}</p>
          {status.devVerificationUrl ? (
            <Link
              className="mt-1 block font-semibold text-primary hover:underline"
              href={status.devVerificationUrl}
            >
              Open development verification link
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
