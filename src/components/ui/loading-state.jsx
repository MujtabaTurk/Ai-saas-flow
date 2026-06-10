import { cn } from "@/lib/utils";

function LoadingState({
  title = "Loading",
  description = "Preparing your workspace...",
  className
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-2xl border border-growth-border bg-white p-8 text-center",
        className
      )}
      role="status"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-growth-border border-t-primary" />
      <h3 className="mt-4 text-lg font-bold text-growth-sidebar">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { LoadingState };
