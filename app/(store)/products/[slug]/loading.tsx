/** Product-specific boundary is prefetched with product links. */
export default function ProductLoading() {
  return (
    <div role="status" aria-label="Opening product" className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <span className="sr-only">Opening product…</span>
      <div aria-hidden="true" className="grid gap-6 motion-safe:animate-pulse xl:grid-cols-2">
        <div className="h-[300px] rounded-2xl border bg-muted sm:h-[420px] lg:h-[500px]" />
        <div className="space-y-5">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-16 w-full rounded bg-muted" />
          <div className="h-10 w-40 rounded bg-muted" />
          <div className="h-44 rounded-2xl border bg-muted" />
        </div>
      </div>
    </div>
  );
}
