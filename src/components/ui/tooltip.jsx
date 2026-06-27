"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

function Tooltip({
  align = "center",
  children,
  className,
  content,
  delayDuration = 350,
  side = "top",
  sideOffset = 8
}) {
  if (!content) {
    return children;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            align={align}
            className={cn(
              "z-[80] max-w-xs rounded-xl border border-growth-border bg-white px-3 py-2 text-xs font-semibold text-growth-sidebar shadow-xl shadow-emerald-950/10 outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 dark:border-white/10 dark:bg-zinc-950 dark:text-white",
              className
            )}
            side={side}
            sideOffset={sideOffset}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-white dark:fill-zinc-950" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip };
