import { ImageResponse } from "next/og";
import { VEST_WORDMARK_HEIGHT, VEST_WORDMARK_PATH, VEST_WORDMARK_WIDTH } from "@/components/brand/vest-block";

const OG_MARK_HEIGHT = 56;
const OG_MARK_WIDTH = Math.round((VEST_WORDMARK_WIDTH / VEST_WORDMARK_HEIGHT) * OG_MARK_HEIGHT);

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
          <svg width={OG_MARK_WIDTH} height={OG_MARK_HEIGHT} viewBox={`0 0 ${VEST_WORDMARK_WIDTH} ${VEST_WORDMARK_HEIGHT}`}>
            <rect width={VEST_WORDMARK_WIDTH} height={VEST_WORDMARK_HEIGHT} fill="#0e1012" />
            <path fill="#ffffff" d={VEST_WORDMARK_PATH} />
          </svg>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 500, letterSpacing: -0.5 }}>Payouts</div>
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
