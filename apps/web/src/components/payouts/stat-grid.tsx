import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  highlight = false,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  tone?: "ink" | "signal" | "green" | "orange";
}) {
  const color =
    tone === "signal" ? "text-signal" : tone === "green" ? "text-green" : tone === "orange" ? "text-orange" : highlight ? "text-signal" : "text-ink";
  return (
    <div className="min-w-0 border border-line bg-background px-4 py-5 md:px-5 md:py-6">
      <dt className={cn("meta", color)}>{label}</dt>
      <dd className={cn("tabular mt-3 break-words font-heading text-[22px] leading-none font-medium tracking-[-0.03em] sm:text-[28px] md:text-[34px]", color)}>
        {value}
      </dd>
      {sub && <dd className="meta mt-2 normal-case tracking-[0.02em]">{sub}</dd>}
    </div>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 lg:grid-cols-4", className)}>{children}</dl>;
}

export function HeroStat({
  label,
  value,
  sub,
  tone = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ink" | "signal" | "green" | "orange";
}) {
  const color =
    tone === "signal" ? "text-signal" : tone === "green" ? "text-green" : tone === "orange" ? "text-orange" : "text-ink";
  return (
    <div className="relative min-w-0 border-b border-r border-line px-2 py-5 text-center odd:border-r md:border-b-0 md:px-4 md:py-8 lg:px-6 md:last:border-r-0">
      <div className={cn("meta font-semibold", color)}>{label}</div>
      <div className={cn("mt-2 text-[26px] leading-none font-medium tracking-[-0.03em] sm:text-[32px] md:mt-5 md:text-[36px] lg:text-[52px] xl:text-[64px]", color)}>
        {value}
      </div>
      {sub && <div className="meta mt-2 hidden md:block">{sub}</div>}
    </div>
  );
}
