/** Prefetched fallback lets taps navigate while catalogue data streams in. */
export default function StoreLoading() {
  return (
    <div role="status" aria-label="Loading page" className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-9 w-2/3 max-w-md rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 rounded-xl border bg-card p-3">
              <div className="aspect-square rounded-lg bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
