"use client";

import { useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({
  checked,
  className,
  defaultChecked = false,
  name,
  onChange,
  onCheckedChange,
  value = "on",
  ...props
}) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const currentChecked = isControlled ? checked : internalChecked;

  function handleCheckedChange(nextChecked) {
    const normalizedChecked = nextChecked === true;

    if (!isControlled) {
      setInternalChecked(normalizedChecked);
    }

    onCheckedChange?.(nextChecked);
    onChange?.({
      target: {
        checked: normalizedChecked,
        name,
        type: "checkbox",
        value
      },
      currentTarget: {
        checked: normalizedChecked,
        name,
        type: "checkbox",
        value
      }
    });
  }

  return (
    <CheckboxPrimitive.Root
      checked={currentChecked}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded border border-growth-border bg-white text-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white",
        className
      )}
      name={name}
      value={value}
      onCheckedChange={handleCheckedChange}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
