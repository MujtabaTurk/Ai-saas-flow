import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-[#2c1ea9]",
        outline: "border border-growth-border bg-white text-growth-sidebar hover:bg-growth-mint/45",
        ghost: "text-growth-sidebar hover:bg-growth-mint/45",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  children,
  className,
  disabled,
  isLoading = false,
  loadingLabel,
  type,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const isDisabled = disabled || isLoading;
  const classNames = cn(
    buttonVariants({ variant, size, className }),
    asChild && isDisabled ? "pointer-events-none opacity-50" : null
  );

  if (asChild) {
    return (
      <Slot
        aria-busy={isLoading || undefined}
        aria-disabled={isDisabled || undefined}
        className={classNames}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      aria-busy={isLoading || undefined}
      className={classNames}
      disabled={isDisabled}
      type={type || "button"}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {isLoading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export { Button, buttonVariants };
