import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-mint">404</p>
      <h1 className="mt-3 text-3xl font-bold text-paper">That page isn&apos;t here</h1>
      <p className="mt-3 text-paper/70">The payout may not be in the database yet, or the address was typed wrong.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-ink-950">
          Home
        </Link>
        <Link href="/payouts" className="rounded-lg border border-ink-700 px-4 py-2 text-sm font-semibold text-paper">
          All payouts
        </Link>
      </div>
    </div>
  );
}
