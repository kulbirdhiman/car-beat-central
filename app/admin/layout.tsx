import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminNav";
import { AdminStoreProvider } from "@/components/admin/AdminStore";
import { Logo } from "@/components/layout/Logo";
import { getAdminData } from "@/lib/server/admin/data";

export const metadata: Metadata = { title: "Admin · CarBeat", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Always render per request: admin data must be live, never a build-time snapshot.
  await connection();
  return (
    <AdminStoreProvider initial={getAdminData()}>
      <div className="min-h-full bg-secondary/50">
        <header className="sticky top-0 z-30 border-b bg-background">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <AdminMobileNav />
              <Link href="/admin" className="flex items-center gap-3">
                <Logo />
                <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background">Admin</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                View store →
              </Link>
            </div>
          </div>
        </header>
        <div className="flex">
          <AdminSidebar />
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </AdminStoreProvider>
  );
}
