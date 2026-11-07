import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PayoutTable } from "@/components/payouts/payout-table";
import { Stat, StatGrid } from "@/components/payouts/stat-grid";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { formatDate, formatUsd, shortAddress } from "@/lib/format";
import { getLeaderboard, getWallet } from "@/lib/payouts/repository";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const rows = await getLeaderboard("all", 30);
    return rows.filter((r) => r.wallet).map((r) => ({ address: r.wallet as string }));
  } catch {
    return [];
  }
}

async function load(params: Promise<{ address: string }>) {
  const { address } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) notFound();
  const wallet = await getWallet(address);
  if (!wallet) notFound();
  return wallet;
}

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const wallet = await load(params);
  const name = wallet.label || shortAddress(wallet.address, 6);
  return pageMetadata({
    title: `${name} — ${formatUsd(wallet.amount)} in Vest payouts`,
    description: `${name} has received ${formatUsd(wallet.amount)} across ${wallet.count} Vest payouts. See every USDC transfer and its on-chain proof.`,
    path: `/wallets/${wallet.address}`,
  });
}

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const wallet = await load(params);
  const name = wallet.label || shortAddress(wallet.address, 6);
  return (
    <div className="mx-auto max-w-5xl px-6 pt-8 md:px-14">
      <Breadcrumbs
        items={[
          { name: "Leaderboard", path: "/leaderboard" },
          { name, path: `/wallets/${wallet.address}` },
        ]}
      />
      <h1 className="mt-5 max-w-full break-words text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[48px]">{name}</h1>
      <p className="mt-2 font-mono text-sm break-all text-muted-foreground">{wallet.address}</p>
      {wallet.xHandle && (
        <p className="mt-2 text-sm">
          <a className="text-green underline underline-offset-4" href={`https://x.com/${wallet.xHandle.replace("@", "")}`} rel="noopener nofollow">
            {wallet.xHandle.startsWith("@") ? wallet.xHandle : `@${wallet.xHandle}`}
          </a>
        </p>
      )}
      <StatGrid className="mt-8">
        <Stat label="Total received" value={formatUsd(wallet.amount)} highlight />
        <Stat label="Payouts" value={String(wallet.count)} />
        <Stat label="Largest" value={wallet.largest ? formatUsd(wallet.largest.amount) : "—"} />
        <Stat label="Last paid" value={formatDate(wallet.payouts[0].paidAt)} />
      </StatGrid>
      <div className="mt-8">
        <PayoutTable payouts={wallet.payouts} caption={`Vest payouts to ${name}`} showWallet={false} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/leaderboard" className="text-green underline underline-offset-4">
          Back to the leaderboard
        </Link>
      </p>
      <div className="mt-12">
        <ReferralPanel placement="wallet" />
      </div>
    </div>
  );
}
