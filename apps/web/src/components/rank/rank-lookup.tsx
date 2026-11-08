"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { SplitInner } from "@/components/ui/split-cta";
import type { RankResponse } from "@/app/api/rank/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInt, shortAddress } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { CARD_H, CARD_W, RankCard, tierFor } from "./rank-card";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const LABEL = "font-mono text-[12px] tracking-[0.04em] text-sub uppercase";

export function RankLookup() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("wallet") ?? "";
  const [draft, setDraft] = useState(initial);
  const [data, setData] = useState<RankResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function lookup(raw: string) {
    const wallet = raw.trim();
    if (!ADDRESS.test(wallet)) {
      setError("Enter a full 0x wallet address (42 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rank?wallet=${wallet.toLowerCase()}`);
      const body = (await res.json()) as RankResponse | { error: string };
      if (!res.ok || "error" in body) {
        setData(null);
        setError("error" in body ? body.error : "Something went wrong. Try again.");
        return;
      }
      setData(body);
      setName(body.label ?? "");
      setHandle(body.xHandle ?? "");
      // Shareable URL without a server round trip.
      window.history.replaceState(null, "", `/rank?wallet=${body.wallet}`);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Deep links (/rank?wallet=0x…) look up straight away.
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !ADDRESS.test(initial)) return;
    ran.current = true;
    void lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function download() {
    if (!cardRef.current || !data) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const bg = getComputedStyle(document.body).backgroundColor;
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: bg,
        filter: (node) => !(node instanceof HTMLElement && node.dataset.exportIgnore !== undefined),
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `vestpayouts-rank-${shortAddress(data.wallet, 4).replace("…", "-")}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      setError("Couldn't create the image. Try again, or take a screenshot.");
    } finally {
      setSaving(false);
    }
  }

  const shareText = data
    ? data.rank !== null
      ? `I'm ranked #${formatInt(data.rank)} of ${formatInt(data.wallets)} wallets on the all-time Vest payout leaderboard. See yours:`
      : "See where your wallet ranks on the all-time Vest payout leaderboard:"
    : "";
  const shareUrl = data ? absoluteUrl(`/rank?wallet=${data.wallet}`) : "";

  return (
    <div>
      <form
        role="search"
        aria-label="Look up a wallet's rank"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(draft);
        }}
        className="flex flex-col gap-3 border border-line bg-paper p-4 sm:flex-row sm:items-end"
      >
        <label className="grid flex-1 gap-1.5">
          <span className={LABEL}>Wallet address</span>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="0x…"
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            aria-invalid={error && !data ? true : undefined}
          />
        </label>
        <button type="submit" disabled={loading} aria-busy={loading} className="split-cta shrink-0 disabled:opacity-80">
          <SplitInner>{loading ? "Looking up…" : "See my rank"}</SplitInner>
        </button>
      </form>

      <p role="status" aria-live="polite" className="min-h-6 pt-3 text-[14px] text-coral">
        {error}
        {error?.startsWith("No Vest payouts") && (
          <>
            {" "}
            <Link href="/payouts" className="text-ink underline underline-offset-4">
              Search all payouts
            </Link>
          </>
        )}
      </p>

      {data && (
        <div ref={resultRef} className="mt-4 grid scroll-mt-28 gap-8 lg:grid-cols-[minmax(0,720px)_minmax(280px,360px)] lg:items-start">
          <ScaledCard key={data.wallet}>
            <RankCard ref={cardRef} data={data} name={name} handle={handle} />
          </ScaledCard>

          <div className="grid gap-4 border border-line p-5">
            <p className="meta">Make it yours</p>
            <label className="grid gap-1.5">
              <span className={LABEL}>Name</span>
              <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 28))} placeholder="Your name" maxLength={28} />
            </label>
            <label className="grid gap-1.5">
              <span className={LABEL}>X handle</span>
              <span className="flex items-center border border-input bg-background focus-within:border-ring">
                <span className="pl-2.5 font-mono text-sub" aria-hidden="true">
                  @
                </span>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 15))}
                  placeholder="handle"
                  className="border-0 pl-1 font-mono focus-visible:ring-0"
                  maxLength={15}
                  aria-label="X handle without the @"
                />
              </span>
            </label>
            <p className="text-[13px] text-sub">Both are optional and only appear on your image. Nothing is saved.</p>
            <Button type="button" onClick={download} disabled={saving} className="h-11 rounded-none font-mono text-[13px] tracking-[0.06em] uppercase">
              {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
              Download image
            </Button>
            <a
              href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center justify-center border border-line font-mono text-[13px] tracking-[0.06em] text-ink uppercase hover:bg-paper"
            >
              Share on X
            </a>
            <p className="text-[13px] text-sub">
              {tierFor(data.rank, data.wallets).label}.{" "}
              <Link href={`/wallets/${data.wallet}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-signal">
                See every payout to this wallet
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Lays the fixed-size card out at its design size and scales it down to fit narrow screens. */
function ScaledCard({ children }: { children: React.ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / CARD_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} className="w-full min-w-0" style={{ height: CARD_H * scale }}>
      <div style={{ width: CARD_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}
