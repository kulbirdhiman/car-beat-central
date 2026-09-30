const MESSAGES = [
  "Free shipping Australia-wide over $99",
  "Pro fitting in every capital city",
  "All prices include GST",
  "Same-day dispatch from Sydney & Melbourne",
  "30-day change-of-mind returns",
];

/** Thin scrolling strip above the header. Content is doubled for a seamless loop. */
export function AnnouncementBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-50 h-9 overflow-clip border-b border-white/10 bg-ink text-ink-foreground/80">
      <ul className="flex h-full w-max animate-marquee items-center gap-10 hover:[animation-play-state:paused]">
        {[...MESSAGES, ...MESSAGES].map((m, i) => (
          <li key={i} aria-hidden={i >= MESSAGES.length} className="label-mono flex items-center gap-10 whitespace-nowrap">
            {m}
            <span className="size-1 rounded-full bg-primary" />
          </li>
        ))}
      </ul>
    </div>
  );
}
