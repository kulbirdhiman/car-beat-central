import "server-only";
import { listAdminOrders } from "../orders";
import { listAdminProducts, listDepartments } from "./catalog";
import { listCoupons, listOffers } from "./promos";
import { listVehicleMakes } from "./vehicles";

/** Everything the admin panel shows, loaded in one go for the first render. */
export function getAdminData() {
  return {
    departments: listDepartments(),
    makes: listVehicleMakes(),
    products: listAdminProducts(),
    orders: listAdminOrders(),
    offers: listOffers(),
    coupons: listCoupons(),
  };
}

export type AdminData = ReturnType<typeof getAdminData>;
