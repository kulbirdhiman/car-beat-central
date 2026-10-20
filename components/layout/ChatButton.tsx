"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// CarBeat's Facebook page, where shoppers can message us. Opens in a new tab.
export const CHAT_HREF = "https://www.facebook.com/profile.php?id=100063935581016";

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
      aria-label="Chat with us on Facebook (opens in a new tab)"
      className={cn(
        "group fixed right-4 z-40 flex items-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 sm:right-6",
        raised ? "bottom-24" : "bottom-4 sm:bottom-6",
      )}
    >
      <MessageCircle className="size-6" />
      <span className="hidden pr-1 text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  );
}
