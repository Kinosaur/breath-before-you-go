export default function RootLoading() {
  return (
    <main className="min-h-screen bg-[#080B12] px-5 pt-20 pb-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 h-4 w-48 animate-pulse rounded bg-surface-3" aria-hidden="true" />
        <div className="mb-3 h-10 w-80 animate-pulse rounded bg-surface-2" aria-hidden="true" />
        <div className="mb-10 h-5 w-[28rem] max-w-full animate-pulse rounded bg-surface-2" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-36 animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />
          <div className="h-36 animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />
        </div>

        <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
          Loading data and visuals...
        </p>
      </div>
    </main>
  );
}
