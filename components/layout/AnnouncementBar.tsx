const MESSAGES = [
  "Free shipping Australia-wide on orders over $99",
  "Pro fitting in every capital city",
  "All prices include GST",
  "Same-day dispatch from Sydney & Melbourne",
  "30-day change-of-mind returns",
];

/** Thin scrolling strip above the header. Content is doubled for a seamless loop. */
export function AnnouncementBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-50 h-9 overflow-clip bg-primary text-primary-foreground">
      <ul className="flex h-full w-max animate-marquee items-center gap-12 text-xs font-medium hover:[animation-play-state:paused]">
        {[...MESSAGES, ...MESSAGES].map((m, i) => (
          <li key={i} aria-hidden={i >= MESSAGES.length} className="flex items-center gap-12 whitespace-nowrap">
            {m}
            <span className="opacity-60">✦</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
