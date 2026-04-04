export default function CityLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 pt-16 pb-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-surface-3" aria-hidden="true" />
        <div className="mb-2 h-12 w-64 animate-pulse rounded bg-surface-2" aria-hidden="true" />
        <div className="mb-8 h-5 w-48 animate-pulse rounded bg-surface-2" aria-hidden="true" />

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />
          <div className="h-40 animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />
          <div className="h-40 animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />
          <div className="h-40 animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />
        </div>

        <div className="h-[420px] animate-pulse rounded-xl border border-surface-3 bg-surface-2" aria-hidden="true" />

        <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
          Loading city data and charts...
        </p>
      </div>
    </main>
  );
}
