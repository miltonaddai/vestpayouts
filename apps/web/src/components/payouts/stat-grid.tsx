import { cn } from "@/lib/utils";

export function Stat({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        highlight ? "border-mint/30 bg-mint/[0.06]" : "border-ink-800 bg-ink-900/60",
      )}
    >
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("tabular mt-2 font-mono text-2xl font-semibold sm:text-3xl", highlight ? "text-mint" : "text-paper")}>
        {value}
      </dd>
      {sub && <dd className="mt-1 text-xs text-muted-foreground">{sub}</dd>}
    </div>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>{children}</dl>;
}
