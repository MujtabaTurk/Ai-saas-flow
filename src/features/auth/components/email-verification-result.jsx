"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function EmailVerificationResult({
  token,
  callbackUrl = "/customer"
}) {
  const { update } = useSession();
  const [state, setState] = useState({
    status: token ? "verifying" : "missing",
    message: token
      ? "Verifying your email..."
      : "Missing verification token. Please request a new verification email."
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCurrent = true;

    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        });
        const payload = await response.json().catch(() => null);

        if (!isCurrent) {
          return;
        }

        if (!response.ok) {
          setState({
            status: "error",
            message:
              payload?.error?.message ||
              "This verification link could not be used."
          });
          return;
        }

        await update();
        setState({
          status: "success",
          message: payload?.data?.message || "Email verified successfully."
        });
      } catch {
        if (isCurrent) {
          setState({
            status: "error",
            message: "Email verification failed. Please try again."
          });
        }
      }
    }

    void verifyEmail();

    return () => {
      isCurrent = false;
    };
  }, [token, update]);

  const isError = state.status === "error" || state.status === "missing";

  return (
    <div className="space-y-4">
      <div
        aria-live="polite"
        className={
          isError
            ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            : "rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar"
        }
      >
        {state.message}
      </div>
      {state.status === "verifying" ? null : (
        <Button asChild className="w-full">
          <Link href={callbackUrl}>Continue</Link>
        </Button>
      )}
    </div>
  );
}
