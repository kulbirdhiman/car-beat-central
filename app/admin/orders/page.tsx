import { Suspense } from "react";
import { OrdersManager } from "./OrdersManager";

export const metadata = { title: "Orders · Admin · CarBeat" };

export default function AdminOrdersPage() {
  // OrdersManager reads ?status= and ?open= from the URL, which needs a Suspense boundary.
  return (
    <Suspense>
      <OrdersManager />
    </Suspense>
  );
}
