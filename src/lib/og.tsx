import { ImageResponse } from "next/og";

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
          background: "radial-gradient(ellipse at 15% 0%, #123a2b 0%, #07090a 60%)",
          color: "#eef3f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#0d1112" />
            <path d="M10 7.5h8.2L23.5 13V24.5a1.5 1.5 0 0 1-1.5 1.5H10a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 10 7.5z" fill="none" stroke="#94a3a0" strokeWidth="1.6" />
            <path d="M18.2 7.5V13H23.5" fill="none" stroke="#94a3a0" strokeWidth="1.6" />
            <rect x="11.2" y="16.2" width="9.2" height="2" rx="1" fill="#3ee0a1" />
            <rect x="11.2" y="20.2" width="6" height="2" rx="1" fill="#8ff0c6" />
          </svg>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            Vest<span style={{ color: "#3ee0a1" }}>Payouts</span>
          </div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 22, color: "#9aaaa6" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {value && <div style={{ display: "flex", fontSize: 112, fontWeight: 800, color: "#3ee0a1", letterSpacing: -3 }}>{value}</div>}
          <div style={{ display: "flex", fontSize: value ? 44 : 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#9aaaa6" }}>
          <span>{footer ?? "Vest payouts, verified on-chain"}</span>
          <span>Independent · not affiliated with Vest</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
