import { ClerkProvider, SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { AccountNav } from "@/components/account/AccountNav";
import { requireCustomer } from "@/lib/server/customer";

export const metadata: Metadata = { title: "My account · CarBeat", robots: { index: false } };

/** Signed-in customers only. Each page also checks, since a layout isn't re-run when moving between its pages. */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const customer = await requireCustomer("/account");
  return (
    <ClerkProvider>
      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
          <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
            <div className="hidden rounded-xl bg-card p-5 ring-1 ring-foreground/[0.07] lg:block">
              <p className="label-mono text-muted-foreground">Signed in as</p>
              <p className="mt-2 truncate font-semibold">{customer.name || customer.email}</p>
              {customer.name && <p className="truncate text-sm text-muted-foreground">{customer.email}</p>}
            </div>
            <AccountNav />
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </SignOutButton>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </ClerkProvider>
  );
}
