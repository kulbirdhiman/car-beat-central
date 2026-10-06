"use client";

import { Download, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Empty, PageHeader, fmtDate, fmtDateTime } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { bookings as bookingsTable } from "@/lib/server/schema";
import type { AdminReview } from "@/lib/server/reviews";

type Booking = typeof bookingsTable.$inferSelect;
type Subscriber = { email: string; createdAt: string };

const TABS = ["bookings", "reviews", "subscribers"] as const;
type Tab = (typeof TABS)[number];

/** Fitting bookings, product reviews and newsletter subscribers, as submitted on the store. */
export function CustomersManager({ bookings, subscribers, reviews }: { bookings: Booking[]; subscribers: Subscriber[]; reviews: AdminReview[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get("tab");
  const tab: Tab = TABS.includes(param as Tab) ? (param as Tab) : "bookings";

  return (
    <>
      <PageHeader title="Customers" description="Fitting requests, product reviews and newsletter sign-ups from the store." />
      <Tabs value={tab} onValueChange={(v) => router.replace(v === "bookings" ? pathname : `${pathname}?tab=${v}`, { scroll: false })}>
        <TabsList className="mb-4">
          <TabsTrigger value="bookings">Fitting bookings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <Bookings rows={bookings} />
        </TabsContent>
        <TabsContent value="reviews">
          <Reviews rows={reviews} />
        </TabsContent>
        <TabsContent value="subscribers">
          <Subscribers rows={subscribers} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Bookings({ rows }: { rows: Booking[] }) {
  return (
    <Card>
      <CardContent>
        {rows.length === 0 ? (
          <Empty>No fitting bookings yet.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Preferred date</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">{b.name}</div>
                    <a href={`mailto:${b.email}`} className="block text-xs text-muted-foreground hover:underline">
                      {b.email}
                    </a>
                    <a href={`tel:${b.phone}`} className="block text-xs text-muted-foreground hover:underline">
                      {b.phone}
                    </a>
                  </TableCell>
                  <TableCell>{b.vehicle}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell className="tabular-nums">{fmtDate(b.preferredDate)}</TableCell>
                  <TableCell className="hidden max-w-64 whitespace-normal text-muted-foreground lg:table-cell">{b.notes || "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{fmtDateTime(b.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Reviews({ rows }: { rows: AdminReview[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [pending, startTransition] = useTransition();

  async function remove(review: AdminReview) {
    const res = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE", cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? `Couldn't delete the review (error ${res.status}).`);
      return;
    }
    toast.success("Review deleted.");
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardContent>
        {rows.length === 0 ? (
          <Empty>No written reviews yet.</Empty>
        ) : (
          <ul className="divide-y" aria-busy={pending}>
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={n <= r.rating ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-muted-foreground/40"} />
                      ))}
                    </span>
                    <span className="font-medium">{r.title}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.name}
                    {r.vehicle && ` · ${r.vehicle}`} · {fmtDateTime(r.createdAt)} ·{" "}
                    {r.productSlug ? (
                      <Link href={`/products/${r.productSlug}#reviews`} target="_blank" className="underline-offset-2 hover:underline">
                        {r.productName}
                      </Link>
                    ) : (
                      "Deleted product"
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDeleting(r)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this review?"
        description="It's removed from the product page and the product's rating is recalculated. This can't be undone."
        onConfirm={() => deleting && void remove(deleting)}
      />
    </Card>
  );
}

function Subscribers({ rows }: { rows: Subscriber[] }) {
  function exportCsv() {
    const csv = ["email,subscribed_at", ...rows.map((s) => `${s.email},${s.createdAt}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "carbeat-subscribers.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardContent>
        {rows.length === 0 ? (
          <Empty>No newsletter subscribers yet.</Empty>
        ) : (
          <>
            <div className="mb-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download /> Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.email}>
                    <TableCell>{s.email}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtDateTime(s.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
