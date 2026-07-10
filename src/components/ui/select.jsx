"use client";

import { Children, isValidElement, useMemo, useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__serviceflow_empty_select_value__";

function toRadixValue(value) {
  return value === "" || value === null || value === undefined
    ? EMPTY_VALUE
    : String(value);
}

function fromRadixValue(value) {
  return value === EMPTY_VALUE ? "" : value;
}

function normalizeOptions(children) {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => ({
      disabled: child.props.disabled,
      label: child.props.children,
      value:
        child.props.value === undefined
          ? String(child.props.children)
          : String(child.props.value)
    }));
}

function Select({
  children,
  className,
  contentClassName,
  defaultValue,
  disabled,
  id,
  itemClassName,
  itemIndicatorClassName,
  name,
  onChange,
  onValueChange,
  required,
  value,
  ...props
}) {
  const { i18n } = useTranslation();
  const options = useMemo(() => normalizeOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = isControlled ? value ?? "" : internalValue;

  function handleValueChange(nextRadixValue) {
    const nextValue = fromRadixValue(nextRadixValue);

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    onChange?.({
      target: {
        name,
        value: nextValue
      },
      currentTarget: {
        name,
        value: nextValue
      }
    });
  }

  return (
    <>
      {name ? (
        <input
          disabled={disabled}
          name={name}
          readOnly
          type="hidden"
          value={selectedValue}
        />
      ) : null}
      <SelectPrimitive.Root
        dir={i18n.dir()}
        disabled={disabled}
        required={required}
        value={toRadixValue(selectedValue)}
        onValueChange={handleValueChange}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none",
            className
          )}
          id={id}
          name={name}
          type="button"
          value={selectedValue}
          {...props}
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              "z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-growth-border bg-card text-foreground shadow-2xl shadow-[hsl(var(--sf-shadow)/0.16)] outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 dark:shadow-[hsl(var(--sf-shadow)/0.45)]",
              contentClassName
            )}
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-lg py-2 pe-9 ps-3 text-start text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-foreground data-[disabled]:opacity-50",
                    itemClassName
                  )}
                  disabled={option.disabled}
                  key={`${option.value}-${String(option.label)}`}
                  value={toRadixValue(option.value)}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator
                    className={cn(
                      "absolute end-3 inline-flex items-center justify-center text-primary",
                      itemIndicatorClassName
                    )}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}

export { Select };
