import { Suspense } from "react";
import { listBookings, listSubscribers } from "@/lib/server/orders";
import { listAdminReviews } from "@/lib/server/reviews";
import { CustomersManager } from "./CustomersManager";

export const metadata = { title: "Customers · Admin · CarBeat" };

export default function AdminCustomersPage() {
  // The admin layout renders per request, so this is always live. CustomersManager reads ?tab=, which needs Suspense.
  return (
    <Suspense>
      <CustomersManager bookings={listBookings(500)} subscribers={listSubscribers(1000)} reviews={listAdminReviews()} />
    </Suspense>
  );
}
