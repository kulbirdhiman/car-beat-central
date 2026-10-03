"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdminStore } from "@/components/admin/AdminStore";
import { PageHeader } from "@/components/admin/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { promoStatus } from "@/lib/admin/mock-data";
import { CouponsTab } from "./CouponsTab";
import { OffersTab } from "./OffersTab";

export function OffersAndCoupons() {
  const { offers, coupons } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const tab = useSearchParams().get("tab") === "coupons" ? "coupons" : "offers";

  const liveOffers = offers.filter((o) => promoStatus(o) === "live").length;
  const liveCoupons = coupons.filter((c) => promoStatus(c) === "live").length;

  return (
    <>
      <PageHeader
        title="Offers & Coupons"
        description={`${liveOffers} offers and ${liveCoupons} coupon codes live right now. Offers are the promo banners on the store; coupon codes are entered at checkout.`}
      />
      <Tabs value={tab} onValueChange={(v) => router.replace(v === "coupons" ? `${pathname}?tab=coupons` : pathname, { scroll: false })}>
        <TabsList className="mb-4">
          <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
          <TabsTrigger value="coupons">Coupon codes ({coupons.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="offers">
          <OffersTab />
        </TabsContent>
        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
