import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StickyMobileCta } from "@/components/referral/sticky-mobile-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `Vest Payouts Tracker — Live Vest Payout Proof | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: { siteName: SITE.name, locale: SITE.locale, type: "website" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#07090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${mono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-mint px-4 py-2 font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <StickyMobileCta />
      </body>
    </html>
  );
}
