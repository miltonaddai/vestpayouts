"use client";

import { cn } from "@/lib/utils";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Odometer-style text: every digit is a 0-9 wheel that rolls to its new value
 * when `value` changes; other characters ($ , . M K) stay put. Digits are keyed
 * from the right so the ones place stays the ones place as the number grows.
 * Screen readers get the plain string; reduced-motion users get an instant swap.
 */
export function RollingNumber({ value, className }: { value: string; className?: string }) {
  const chars = [...value];
  const n = chars.length;
  return (
    <span className={cn("relative inline-flex tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      {/* Unselectable, so copying the number picks up the sr-only text, not ten digits per wheel. */}
      <span aria-hidden="true" className="inline-flex select-none">
        {chars.map((ch, i) => {
          const fromRight = n - 1 - i;
          return DIGITS.includes(ch) ? (
            <DigitWheel key={`d${fromRight}`} digit={Number(ch)} order={fromRight} />
          ) : (
            <span key={`c${fromRight}-${ch}`}>{ch}</span>
          );
        })}
      </span>
    </span>
  );
}

function DigitWheel({ digit, order }: { digit: number; order: number }) {
  return (
    // The invisible digit sizes the slot; the wheel is clipped to one line.
    <span className="relative inline-block overflow-hidden">
      <span className="invisible">{digit}</span>
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          transform: `translateY(${-digit * 10}%)`,
          // Lower places settle first, like a mechanical counter.
          transitionDelay: `${Math.min(order, 8) * 35}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}
