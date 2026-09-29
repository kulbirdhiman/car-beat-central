import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Admin · CarBeat", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full bg-secondary/50">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo />
            <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background">Admin</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            View store →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
