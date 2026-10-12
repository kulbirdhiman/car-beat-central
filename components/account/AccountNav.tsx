"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LayoutDashboard, LogOut, MapPin, Package, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile & security", icon: UserCog },
] as const;

/** Account sections: a sidebar on desktop, a scrolling row of tabs on phones. */
export function AccountNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/account" ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                active(href) ? "bg-foreground text-background hover:bg-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          </li>
        ))}
        <li className="shrink-0 lg:hidden">
          <SignOutButton redirectUrl="/">
            <button type="button" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="size-4" /> Sign out
            </button>
          </SignOutButton>
        </li>
      </ul>
    </nav>
  );
}
