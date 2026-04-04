"use client";

import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CityError({ error, reset }: Props) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 pt-16 pb-10">
      <div className="mx-auto max-w-3xl rounded-xl border border-surface-3 bg-surface-2 p-6">
        <h1 className="text-2xl font-semibold text-ink">City page unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          We could not load this city right now. Please retry, or return to the city list.
        </p>
        {error?.digest ? (
          <p className="mt-3 text-xs font-mono text-ink-faint">Error ID: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-surface-3 bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-ink-faint/60"
          >
            Retry city load
          </button>
          <Link
            href="/"
            className="rounded-full border border-surface-3 bg-surface px-4 py-2 text-sm text-ink-muted transition-colors hover:border-ink-faint/60 hover:text-ink"
          >
            Back to all cities
          </Link>
        </div>
      </div>
    </main>
  );
}
