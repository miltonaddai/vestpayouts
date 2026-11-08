"use client";

import { useId } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

/** Radix can't use "" as an item value, so empty values travel as this sentinel. */
const EMPTY = "__any__";

/**
 * Labelled dropdown in the site's style: sharp borders, mono label, a popover
 * that matches the trigger width. Keyboard and screen-reader behaviour come
 * from Radix Select.
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <span id={id} className="font-mono text-[12px] tracking-[0.04em] text-sub uppercase">
        {label}
      </span>
      <SelectPrimitive.Root value={value || EMPTY} onValueChange={(v) => onChange(v === EMPTY ? "" : v)}>
        <SelectPrimitive.Trigger
          aria-labelledby={id}
          className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 border border-line bg-background px-3 text-left text-[15px] text-ink transition-colors outline-none hover:border-sub focus-visible:border-signal focus-visible:ring-3 focus-visible:ring-signal/25 data-[state=open]:border-ink"
        >
          <span className="truncate">
            <SelectPrimitive.Value />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              className="size-4 shrink-0 text-sub transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden border border-ink bg-background shadow-[4px_4px_0_0_var(--line)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value || EMPTY}
                  value={o.value || EMPTY}
                  className="relative flex h-10 cursor-pointer items-center pr-9 pl-3 text-[15px] text-ink outline-none select-none data-[highlighted]:bg-paper data-[state=checked]:font-medium"
                >
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex text-signal">
                    <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
