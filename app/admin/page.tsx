import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCents } from "@/lib/data";
import { getStats, listBookings, listOrders, listSubscribers } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "./actions";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
};

const fmtDate = (sqlite: string) =>
  new Date(`${sqlite.replace(" ", "T")}Z`).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" });

export default async function AdminPage() {
  // Reads live data on every request (the SQLite driver is synchronous, so opt out of prerendering).
  await connection();
  const stats = getStats();
  const orders = listOrders();
  const bookings = listBookings();
  const subscribers = listSubscribers();

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold uppercase">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Orders", value: stats.orders.toLocaleString("en-AU") },
          { label: "Order value (incl. GST)", value: formatCents(stats.revenue) },
          { label: "Fitting requests", value: stats.bookings.toLocaleString("en-AU") },
          { label: "Newsletter subscribers", value: stats.subscribers.toLocaleString("en-AU") },
        ].map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="bookings">Fittings ({bookings.length})</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardContent>
              {orders.length === 0 ? (
                <Empty>No orders yet.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono">#{o.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell>{fmtDate(o.created_at)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{o.name}</div>
                          <div className="text-xs text-muted-foreground">{o.email}</div>
                        </TableCell>
                        <TableCell>{o.state}</TableCell>
                        <TableCell className="text-right">{o.items}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCents(o.total)}</TableCell>
                        <TableCell>
                          {/* Keyed by status so the select remounts with the saved value after React resets the form. */}
                          <form key={o.status} action={updateOrderStatus} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={o.id} />
                            <select name="status" defaultValue={o.status} aria-label="Order status" className="h-8 rounded-md border bg-background px-2 text-sm">
                              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                              Save
                            </button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardContent>
              {bookings.length === 0 ? (
                <Empty>No fitting requests yet.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Preferred date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{fmtDate(b.created_at)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{b.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.email} · {b.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{b.city}</Badge>
                        </TableCell>
                        <TableCell>{b.vehicle}</TableCell>
                        <TableCell>{new Date(`${b.preferred_date}T00:00`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</TableCell>
                        <TableCell className="max-w-64 whitespace-normal text-muted-foreground">{b.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardContent>
              {subscribers.length === 0 ? (
                <Empty>No subscribers yet.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((s) => (
                      <TableRow key={s.email}>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{fmtDate(s.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
