import "server-only";
import { listAdminOrders } from "../orders";
import { listAdminProducts, listDepartments } from "./catalog";
import { listCoupons, listOffers } from "./promos";
import { listVehicleMakes } from "./vehicles";

/** Everything the admin panel shows, loaded in one go for the first render. */
export async function getAdminData() {
  const [departments, makes, products, orders, offers, coupons] = await Promise.all([
    listDepartments(),
    listVehicleMakes(),
    listAdminProducts(),
    listAdminOrders(),
    listOffers(),
    listCoupons(),
  ]);
  return { departments, makes, products, orders, offers, coupons };
}

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
