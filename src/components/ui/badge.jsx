import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded px-2.5 py-1 text-xs font-bold transition-colors", {
  variants: {
    variant: {
      default: "bg-primary-soft text-serviceflow-subtle",
      success: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success-foreground))]",
      warning: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning-foreground))]",
      destructive: "bg-[hsl(var(--error-bg))] text-[hsl(var(--error-foreground))]",
      outline: "border border-growth-border bg-card text-foreground"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
