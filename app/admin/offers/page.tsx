import { Suspense } from "react";
import { OffersAndCoupons } from "./OffersAndCoupons";

export const metadata = { title: "Offers & Coupons · Admin · CarBeat" };

export default function AdminOffersPage() {
  // The active tab lives in ?tab=, which needs a Suspense boundary.
  return (
    <Suspense>
      <OffersAndCoupons />
    </Suspense>
  );
}
