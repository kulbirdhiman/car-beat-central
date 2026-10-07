import { ClerkProvider, SignOutButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminNav";
import { AdminStoreProvider } from "@/components/admin/AdminStore";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { adminAccess } from "@/lib/server/admin-auth";
import { getAdminData } from "@/lib/server/admin/data";

export const metadata: Metadata = { title: "Admin · CarBeat", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Always render per request: admin data must be live, never a build-time snapshot.
  await connection();
  const access = await adminAccess();
  if (access === "signed-out") redirect("/sign-in");
  if (access === "forbidden") {
    return (
      <ClerkProvider>
        <div className="grid min-h-dvh place-items-center px-4 text-center">
          <div>
            <Logo />
            <h1 className="mt-10 font-display text-3xl font-bold">No admin access</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              This account isn&apos;t an admin. Sign in with an admin email, or ask an admin to add yours to ADMIN_EMAILS.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <SignOutButton redirectUrl="/sign-in">
                <Button>Sign in with another account</Button>
              </SignOutButton>
              <Button asChild variant="outline">
                <Link href="/">Back to store</Link>
              </Button>
            </div>
          </div>
        </div>
      </ClerkProvider>
    );
  }
  return (
    <ClerkProvider>
      <AdminStoreProvider initial={await getAdminData()}>
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
                <UserButton />
              </div>
            </div>
          </header>
          <div className="flex">
            <AdminSidebar />
            <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
          </div>
        </div>
      </AdminStoreProvider>
    </ClerkProvider>
  );
}
