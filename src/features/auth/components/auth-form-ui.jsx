import { cn } from "@/lib/utils";

export const AUTH_INPUT_CLASS_NAME =
  "h-11 rounded-[8px] border-[#c7c4d8] bg-white text-[#0b1c30] shadow-none placeholder:text-[#9aa3b2] focus-visible:ring-[#3525cd]/25";

export const AUTH_COMPACT_INPUT_CLASS_NAME = `${AUTH_INPUT_CLASS_NAME} lg:h-10`;

const alertClassNames = {
  error:
    "rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700",
  errorCompact:
    "rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700",
  success:
    "rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800",
  warning:
    "rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
};

export function AuthInputIcon({ icon: Icon }) {
  return (
    <Icon
      className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#8a93a6]"
      aria-hidden="true"
    />
  );
}

export function AuthFormAlert({
  children,
  className,
  compact = false,
  role,
  variant = "error"
}) {
  const alertVariant = compact && variant === "error" ? "errorCompact" : variant;
  const resolvedRole =
    role || (variant === "success" ? "status" : "alert");

  if (!children) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn(alertClassNames[alertVariant], className)}
      role={resolvedRole}
    >
      {children}
    </div>
  );
}

export function AuthOAuthDivider({ children = "Or continue with" }) {
  return (
    <div className="relative flex h-7 items-center justify-center text-xs uppercase tracking-[0.1em] text-[#8a93a6]">
      <span className="absolute inset-x-0 top-1/2 h-px bg-[#e3e7ef]" />
      <span className="relative bg-white px-4">{children}</span>
    </div>
  );
}
