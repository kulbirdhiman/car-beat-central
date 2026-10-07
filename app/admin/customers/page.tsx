import { Suspense } from "react";
import { listBookings, listSubscribers } from "@/lib/server/orders";
import { listAdminReviews } from "@/lib/server/reviews";
import { CustomersManager } from "./CustomersManager";

export const metadata = { title: "Customers · Admin · CarBeat" };

export default async function AdminCustomersPage() {
  // The admin layout renders per request, so this is always live. CustomersManager reads ?tab=, which needs Suspense.
  const [bookings, subscribers, reviews] = await Promise.all([listBookings(500), listSubscribers(1000), listAdminReviews()]);
  return (
    <Suspense>
      <CustomersManager bookings={bookings} subscribers={subscribers} reviews={reviews} />
    </Suspense>
  );
}
