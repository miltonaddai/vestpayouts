import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Trophy } from "lucide-react";
import { formatInt, formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { PERIOD_LABEL, type LeaderboardRow, type Period } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";
import { TimeAgo } from "./time-ago";

const PLACES = [
  { name: "Gold", color: "var(--gold)" },
  { name: "Silver", color: "var(--silver)" },
  { name: "Bronze", color: "var(--bronze)" },
] as const;

/**
 * Top three as podium cards (2 · 1 · 3 on wide screens, 1 · 2 · 3 stacked on
 * phones). Each card's "image" is a crest generated from the wallet address,
 * so every trader has a stable, recognisable mark without needing a photo.
 */
export function LeaderboardPodium({ rows, period }: { rows: LeaderboardRow[]; period: Period }) {
  const top = rows.slice(0, 3);
  if (!top.length) return null;
  return (
    <ol
      aria-label={`Top ${top.length}, ${PERIOD_LABEL[period].toLowerCase()}`}
      className="mt-8 grid items-end gap-4 md:grid-cols-3 md:gap-5"
      data-reveal-children
    >
      {top.map((row, i) => (
        <PodiumCard key={row.key} row={row} place={i} period={period} />
      ))}
    </ol>
  );
}

function PodiumCard({ row, place, period }: { row: LeaderboardRow; place: number; period: Period }) {
  const medal = PLACES[place];
  const rank = String(place + 1).padStart(2, "0");
  const name = row.label ?? (row.wallet ? shortAddress(row.wallet, 4) : "Unknown trader");
  const style = { "--medal": medal.color } as CSSProperties;

  const body = (
    <>
      <Plate seed={row.wallet ?? row.key} rank={rank} tall={place === 0} />
      <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
        <p className="flex items-center gap-1.5 font-mono text-[12px] font-semibold tracking-[0.12em] text-(--medal) uppercase">
          <Trophy className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
          No. {rank} · {medal.name}
        </p>
        <p className={cn("mt-2 truncate text-[22px] leading-tight font-medium tracking-[-0.02em] text-ink", !row.label && "font-mono text-[19px]")}>
          {name}
        </p>
        {row.label && row.wallet && <p className="mt-0.5 font-mono text-[12px] text-sub">{shortAddress(row.wallet, 4)}</p>}
        <p className="mt-3 flex flex-wrap gap-x-2 gap-y-0.5 text-[13px] text-sub">
          <span>
            {formatInt(row.count)} payout{row.count === 1 ? "" : "s"}
          </span>
          <span aria-hidden="true">·</span>
          <span>largest {formatUsd(row.largest)}</span>
          <span aria-hidden="true">·</span>
          <span>
            last paid <TimeAgo ms={row.lastPaidAt} initial={timeAgo(row.lastPaidAt)} />
          </span>
        </p>
        <div className="mt-auto border-t border-line pt-4">
          <p className="tabular font-heading text-[32px] leading-none font-medium tracking-[-0.03em] text-ink md:text-[36px]">
            {formatUsd(row.total)}
          </p>
          <p className="meta mt-1.5">Paid · {PERIOD_LABEL[period]}</p>
        </div>
      </div>
    </>
  );

  const cardClass = cn(
    "group flex h-full flex-col border border-line bg-background transition-[translate,border-color] duration-300 ease-out",
    "hover:-translate-y-1 hover:border-(--medal) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--medal)",
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  );

  return (
    <li
      style={style}
      className={cn(
        // Podium order on wide screens: silver, gold, bronze.
        place === 0 && "md:order-2",
        place === 1 && "md:order-1",
        place === 2 && "md:order-3",
      )}
    >
      {row.wallet ? (
        <Link href={`/wallets/${row.wallet}`} className={cardClass} aria-label={`${medal.name}, rank ${place + 1}: ${name}, ${formatUsd(row.total)}`}>
          {body}
        </Link>
      ) : (
        <div className={cardClass}>{body}</div>
      )}
    </li>
  );
}

/** Visual plate: grid paper, a medal glow, the wallet crest and a large rank numeral. */
function Plate({ seed, rank, tall }: { seed: string; rank: string; tall: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden border-b border-line bg-paper", tall ? "aspect-[16/9] md:aspect-[5/4]" : "aspect-[16/9] md:aspect-[16/11]")}
      style={{
        backgroundImage: [
          "radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--medal) 26%, transparent), transparent 62%)",
          "linear-gradient(to right, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
          "linear-gradient(to bottom, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "100% 100%, 28px 28px, 28px 28px",
      }}
    >
      <Critter
        seed={seed}
        crowned={rank === "01"}
        className="absolute top-1/2 left-1/2 w-[34%] max-w-44 -translate-x-1/2 -translate-y-[58%] transition-transform duration-500 ease-out group-hover:-translate-y-[64%] group-hover:scale-105 motion-reduce:transition-none md:w-[44%]"
      />
      <span
        className="absolute bottom-1 left-4 font-heading text-[64px] leading-none font-medium tracking-[-0.05em] text-transparent md:text-[76px]"
        style={{ WebkitTextStroke: "1.5px var(--medal)" }}
      >
        {rank}
      </span>
      {/* Plinth: a medal-coloured bar along the bottom edge. */}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-(--medal)" />
    </div>
  );
}

/*
 * Pixel critters. Each sprite is 12×12, drawn as the left 6 columns and
 * mirrored. Parts are picked from the wallet hex, so the same wallet always
 * gets the same critter. Gold (#1) always wears the crown.
 *
 *   B body   b body shade   E ink (eyes, mouth)   W highlight   C cheek/tongue
 */
type Rows = Record<number, string>;

const HEADS: Rows[] = [
  // round
  { 3: "...BBB", 4: "..BBBB", 5: ".BBBBB", 6: ".BBBBB", 7: ".BBBBB", 8: ".BBBBB", 9: "..BBBB", 10: "..bb..", 11: ".bbb.." },
  // square
  { 3: ".BBBBB", 4: ".BBBBB", 5: ".BBBBB", 6: ".BBBBB", 7: ".BBBBB", 8: ".BBBBB", 9: ".BBBBB", 10: "..b..b", 11: ".bb.bb" },
  // pear
  { 3: "...BBB", 4: "..BBBB", 5: "..BBBB", 6: ".BBBBB", 7: "BBBBBB", 8: "BBBBBB", 9: ".BBBBB", 10: "..bb..", 11: ".bbb.." },
  // ghost
  { 3: "..BBBB", 4: ".BBBBB", 5: ".BBBBB", 6: ".BBBBB", 7: ".BBBBB", 8: ".BBBBB", 9: ".BBBBB", 10: ".BBBBB", 11: ".B.B.B" },
];

const HEADGEAR: Rows[] = [
  { 1: ".B....", 2: ".BB..." }, // cat ears
  { 0: "...b..", 1: "....B.", 2: "....B." }, // antennae
  { 0: "..B...", 1: "..B...", 2: "..BB.." }, // bunny ears
  { 1: "..b...", 2: "..bb.." }, // horns
  { 1: "....bb", 2: "...bbb" }, // tuft
];
const CROWN: Rows = { 0: ".B..B.", 1: ".BB.BB", 2: ".bbbbb" };

const EYES: Rows[] = [
  { 5: "..EE..", 6: "..EW.." }, // big, with a glint
  { 6: "...E.." }, // dots
  { 6: "..EE.." }, // sleepy
  { 5: ".EEEEE", 6: "..EE.." }, // shades
  { 5: "..WE..", 6: "..EE.." }, // side-eye
  { 5: "...E..", 6: "..E.E." }, // happy ^ ^
];

const MOUTHS: Rows[] = [
  { 8: "..E...", 9: "...EEE" }, // smile
  { 8: "....EE", 9: "....EE" }, // "o"
  { 8: "...EEE" }, // flat
  { 8: "...EEE", 9: "....CC" }, // tongue out
  { 8: "....E.", 9: ".....E" }, // smirk-ish wave
];

const FILL: Record<string, { fill: string; opacity?: number }> = {
  B: { fill: "var(--medal)" },
  b: { fill: "var(--medal)", opacity: 0.55 },
  // Fixed, not theme tokens: pupils stay dark and glints stay white in both themes.
  E: { fill: "#15161a" },
  W: { fill: "#ffffff" },
  C: { fill: "var(--coral)", opacity: 0.85 },
};

export function Critter({ seed, crowned, className }: { seed: string; crowned: boolean; className?: string }) {
  const hex = (seed.replace(/^0x/i, "").toLowerCase().replace(/[^0-9a-f]/g, "") + "0123456789abcdef").slice(0, 40);
  const pick = <T,>(list: T[], i: number) => list[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % list.length];

  const grid: string[][] = Array.from({ length: 12 }, () => Array(12).fill("."));
  const paint = (rows: Rows, onlyOnBody = false) => {
    for (const [y, half] of Object.entries(rows)) {
      [...half].forEach((ch, x) => {
        if (ch === ".") return;
        for (const cx of [x, 11 - x]) {
          if (onlyOnBody && grid[+y][cx] === ".") continue;
          grid[+y][cx] = ch;
        }
      });
    }
  };

  paint(pick(HEADS, 0));
  paint(crowned ? CROWN : pick(HEADGEAR, 1));
  paint(pick(EYES, 2), true);
  paint(pick(MOUTHS, 3), true);
  if (parseInt(hex[8], 16) % 2 === 0) paint({ 7: ".C...." }, true); // blush

  const cells: ReactNode[] = [];
  grid.forEach((row, y) =>
    row.forEach((ch, x) => {
      const f = FILL[ch];
      if (f) cells.push(<rect key={`${x}-${y}`} x={x * 10} y={y * 10} width={10} height={10} fill={f.fill} opacity={f.opacity} />);
    }),
  );
  return (
    <svg viewBox="0 0 120 120" className={className} shapeRendering="crispEdges">
      {cells}
    </svg>
  );
}
