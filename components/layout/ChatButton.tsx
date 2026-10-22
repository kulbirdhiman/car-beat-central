"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Opens a Messenger chat with CarBeat (the app on phones, messenger.com on desktop), in a new tab.
export const CHAT_HREF = "https://m.me/carbeats.com.au";

export function ChatButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;

  // Product pages have a sticky buy bar along the bottom edge, so sit above it.
  const raised = pathname.startsWith("/products/");

  return (
    <a
      href={CHAT_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Messenger (opens in a new tab)"
      className={cn(
        "group fixed right-4 z-40 rounded-full focus-visible:outline-none sm:right-6",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        raised ? "bottom-24" : "bottom-4 sm:bottom-6",
      )}
    >
      {/* Soft pulse behind the button to draw the eye without being noisy. */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary/40 animate-ping [animation-duration:2.5s] motion-reduce:hidden"
      />

      <span
        className={cn(
          "relative flex items-center gap-3 rounded-full p-1.5 sm:pr-5",
          "bg-gradient-to-br from-primary via-primary to-[oklch(0.45_0.2_22)] text-primary-foreground",
          "ring-1 ring-white/15 shadow-[0_10px_30px_-6px_var(--color-primary)]",
          "transition-all duration-300 ease-out",
          "group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_-6px_var(--color-primary)]",
          "group-active:translate-y-0 group-active:scale-95",
          "group-focus-visible:outline-none group-focus-visible:ring-4 group-focus-visible:ring-primary/40",
          "motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
        )}
      >
        <span className="relative flex size-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <MessageCircle
            className="size-6 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 motion-reduce:transition-none"
            strokeWidth={2.25}
          />
          {/* "Online" indicator */}
          <span className="absolute right-0.5 top-0.5 flex size-3">
            <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 animate-ping motion-reduce:hidden" />
            <span className="relative inline-flex size-3 rounded-full border-2 border-primary bg-success" />
          </span>
        </span>

        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-bold tracking-tight">Chat with us</span>
          <span className="text-xs text-primary-foreground/80">We usually reply fast</span>
        </span>
      </span>
    </a>
  );
}
