import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-[transform,background-color,border-color,color] duration-200 ease-out active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: "border border-growth-border bg-card text-foreground hover:border-primary/35 hover:bg-accent",
        ghost: "text-foreground hover:bg-accent hover:text-primary",
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
