import { cn } from "@/lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground shadow-sm transition-[border-color,background-color] duration-200 ease-out placeholder:text-muted-foreground hover:border-primary/25 focus-visible:border-primary/70 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
