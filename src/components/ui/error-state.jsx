import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ErrorState({
  title = "Something went wrong",
  description = "ServiceFlow could not finish this request.",
  actionLabel = "Try again",
  onAction,
  action,
  className
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[hsl(var(--error-border))] bg-[hsl(var(--error-bg))] p-8 text-center text-[hsl(var(--error-foreground))]",
        className
      )}
      role="alert"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-lg font-bold text-[hsl(var(--error-foreground))]">
        !
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[hsl(var(--error-foreground))]">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5">{action}</div>
      ) : onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
