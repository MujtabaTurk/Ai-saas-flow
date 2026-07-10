export const switcherMenuStyles = {
  root: "relative z-[100] inline-flex",
  trigger:
    "inline-flex h-10 max-w-[12rem] items-center gap-2 rounded-lg border border-growth-border bg-card/80 px-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition hover:border-primary/35 hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-none",
  triggerCompact: "size-10 max-w-none justify-center px-0",
  triggerOpen: "border-primary/45 bg-card text-primary",
  chevron: "size-3.5 shrink-0 text-muted-foreground transition-transform",
  content:
    "origin-top-inline-end z-[100] w-56 overflow-hidden rounded-lg border border-growth-border bg-card py-1.5 text-foreground shadow-2xl shadow-[hsl(var(--sf-shadow)/0.18)] outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 dark:shadow-[hsl(var(--sf-shadow)/0.45)]",
  item:
    "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-start text-sm font-medium transition hover:bg-accent focus:bg-accent focus:outline-none data-[highlighted]:bg-accent data-[highlighted]:outline-none",
  itemSelected: "bg-accent text-primary",
  check: "size-4 shrink-0 text-primary transition-opacity"
};
