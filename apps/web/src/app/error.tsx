"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center md:px-14">
      <p className="meta">Error</p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-ink">Payout data is unavailable</h1>
      <p className="mt-3 text-sub">
        The database didn&apos;t answer. The page will try again, and the last published version is usually still cached.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 bg-ink px-5 py-3 font-mono text-[12px] tracking-[0.04em] text-background uppercase"
      >
        Try again
      </button>
    </div>
  );
}
