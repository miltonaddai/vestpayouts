import { ImageResponse } from "next/og";
import { VEST_BLOCK_PATH } from "@/components/brand/vest-block";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 card used by every dynamic OG/Twitter image. */
export function ogCard({ eyebrow, title, value, footer }: { eyebrow: string; title: string; value?: string; footer?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#ffffff",
          color: "#0e1012",
          fontFamily: "sans-serif",
          border: "16px solid #0e1012",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" fill="#0e1012" />
            <path fill="#ffffff" d={VEST_BLOCK_PATH} />
          </svg>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 500, letterSpacing: -0.5 }}>VestPayouts</div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 18, color: "#60636a", letterSpacing: 1, textTransform: "uppercase" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {value && <div style={{ display: "flex", fontSize: 108, fontWeight: 500, color: "#2f4cff", letterSpacing: -4 }}>{value}</div>}
          <div style={{ display: "flex", fontSize: value ? 40 : 60, fontWeight: 500, lineHeight: 1.05, maxWidth: 1000, letterSpacing: -1 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#60636a" }}>
          <span>{footer ?? "Vest payouts, verified on-chain"}</span>
          <span>Independent · not affiliated with Vest</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
