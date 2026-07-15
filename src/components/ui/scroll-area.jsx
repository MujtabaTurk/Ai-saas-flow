"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef(
  ({
    className,
    children,
    orientation = "vertical",
    viewportClassName,
    viewportProps,
    ...props
  }, ref) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn("h-full min-h-0 w-full scroll-smooth rounded-[inherit]", viewportClassName)}
        {...viewportProps}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" ? <ScrollBar /> : null}
      {orientation !== "vertical" ? <ScrollBar orientation="horizontal" /> : null}
      {orientation === "both" ? (
        <ScrollAreaPrimitive.Corner className="bg-transparent" />
      ) : null}
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "z-10 flex touch-none select-none p-0.5 transition-colors duration-200",
        orientation === "vertical" && "h-full w-2.5",
        orientation === "horizontal" && "h-2.5 flex-col",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-foreground/20 transition-colors duration-200 hover:bg-foreground/35 active:bg-foreground/45" />
    </ScrollAreaPrimitive.Scrollbar>
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

const HorizontalScrollArea = React.forwardRef(
  ({ viewportClassName, viewportProps, ...props }, ref) => (
    <ScrollArea
      orientation="horizontal"
      ref={ref}
      viewportClassName={viewportClassName}
      viewportProps={{ tabIndex: 0, ...viewportProps }}
      {...props}
    />
  )
);
HorizontalScrollArea.displayName = "HorizontalScrollArea";

export { HorizontalScrollArea, ScrollArea, ScrollBar };
