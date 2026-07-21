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
              "z-[80] max-w-xs rounded-xl border border-growth-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm outline-none animate-in fade-in-0 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 duration-150",
              className
            )}
            side={side}
            sideOffset={sideOffset}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-card" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip };
