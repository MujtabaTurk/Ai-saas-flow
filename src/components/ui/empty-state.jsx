import { cn } from "@/lib/utils";

function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  className
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-growth-mint text-lg font-bold text-growth-sidebar">
        SF
      </div>
      <h3 className="text-lg font-bold text-growth-sidebar">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
