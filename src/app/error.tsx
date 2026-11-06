"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-paper">Payout data is unavailable</h1>
      <p className="mt-3 text-paper/70">
        The database didn&apos;t answer. The page will try again, and the last published version is usually still cached.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-ink-950"
      >
        Try again
      </button>
    </div>
  );
}
