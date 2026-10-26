import { Suspense } from "react";
import { connection } from "next/server";
import { listAdminOrders, listBookings, listSubscribers } from "@/lib/server/orders";
import { listAdminReviews } from "@/lib/server/reviews";
import { CustomersManager } from "./CustomersManager";

export const metadata = { title: "Customers · Admin · CarBeat" };

export default async function AdminCustomersPage() {
  await connection();
  const [orders, bookings, subscribers, reviews] = await Promise.all([listAdminOrders(), listBookings(500), listSubscribers(1000), listAdminReviews()]);
  return (
    <Suspense>
      <CustomersManager orders={orders} bookings={bookings} subscribers={subscribers} reviews={reviews} />
    </Suspense>
  );
}
