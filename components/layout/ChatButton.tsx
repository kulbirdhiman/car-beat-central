"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Page the floating chat button opens.
export const CHAT_HREF = "/contact";

export function ChatButton() {
  const pathname = usePathname();
  if (pathname === CHAT_HREF || pathname.startsWith("/checkout")) return null;

  // Product pages have a sticky buy bar along the bottom edge, so sit above it.
  const raised = pathname.startsWith("/products/");

  return (
    <Link
      href={CHAT_HREF}
      aria-label="Chat with us"
      className={cn(
        "group fixed right-4 z-40 flex items-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 sm:right-6",
        raised ? "bottom-24" : "bottom-4 sm:bottom-6",
      )}
    >
      <MessageCircle className="size-6" />
      <span className="hidden pr-1 text-sm font-semibold sm:inline">Chat with us</span>
    </Link>
  );
}
