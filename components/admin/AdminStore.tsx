"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  COUPONS,
  DEPARTMENTS,
  OFFERS,
  ORDERS,
  PRODUCTS,
  VEHICLE_MAKES,
  type AdminOrder,
  type AdminProduct,
  type Coupon,
  type Department,
  type Offer,
  type VehicleMake,
  type VehicleModel,
} from "@/lib/admin/mock-data";
import type { OrderStatus } from "@/lib/types";

/**
 * In-memory admin data, shared by every admin page. The layout stays mounted while you move
 * between pages, so edits carry across pages; a reload resets to the static sample data.
 */

type Store = {
  departments: Department[];
  makes: VehicleMake[];
  products: AdminProduct[];
  orders: AdminOrder[];
  offers: Offer[];
  coupons: Coupon[];
  saveDepartment: (d: Department) => void;
  deleteDepartment: (id: string) => void;
  setDepartments: (departments: Department[]) => void;
  saveProduct: (p: AdminProduct) => void;
  deleteProduct: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setMakes: (update: (makes: VehicleMake[]) => VehicleMake[]) => void;
  saveOffer: (o: Offer) => void;
  deleteOffer: (id: string) => void;
  setOffers: (offers: Offer[]) => void;
  saveCoupon: (c: Coupon) => void;
  deleteCoupon: (id: string) => void;
};

const AdminStoreContext = createContext<Store | null>(null);

/** Replaces the item with the same id, or adds it: at the top, or at the end for drag-ordered lists. */
function upsert<T extends { id: string }>(list: T[], item: T, addAt: "start" | "end" = "start") {
  if (list.some((x) => x.id === item.id)) return list.map((x) => (x.id === item.id ? item : x));
  return addAt === "start" ? [item, ...list] : [...list, item];
}

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [makes, setMakesState] = useState(VEHICLE_MAKES);
  const [products, setProducts] = useState(PRODUCTS);
  const [orders, setOrders] = useState(ORDERS);
  const [offers, setOffers] = useState(OFFERS);
  const [coupons, setCoupons] = useState(COUPONS);

  const store = useMemo<Store>(
    () => ({
      departments,
      makes,
      products,
      orders,
      offers,
      coupons,
      saveDepartment: (d) => setDepartments((list) => upsert(list, d, "end")),
      deleteDepartment: (id) => setDepartments((list) => list.filter((d) => d.id !== id)),
      setDepartments,
      saveProduct: (p) => setProducts((list) => upsert(list, p)),
      deleteProduct: (id) => setProducts((list) => list.filter((p) => p.id !== id)),
      setOrderStatus: (id, status) => setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o))),
      setMakes: (update) => setMakesState(update),
      saveOffer: (o) => setOffers((list) => upsert(list, o, "end")),
      deleteOffer: (id) => setOffers((list) => list.filter((o) => o.id !== id)),
      setOffers,
      saveCoupon: (c) => setCoupons((list) => upsert(list, c)),
      // Offers that showed this coupon keep running, just without a code.
      deleteCoupon: (id) => {
        setCoupons((list) => list.filter((c) => c.id !== id));
        setOffers((list) => list.map((o) => (o.couponId === id ? { ...o, couponId: null } : o)));
      },
    }),
    [departments, makes, products, orders, offers, coupons],
  );

  return <AdminStoreContext value={store}>{children}</AdminStoreContext>;
}

export function useAdminStore() {
  const store = useContext(AdminStoreContext);
  if (!store) throw new Error("useAdminStore must be used inside <AdminStoreProvider>");
  return store;
}

/** Short random id for records created in the admin panel. */
export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Makes and models, edited immutably. Each helper returns a new array for setMakes. */
export const vehicles = {
  updateMake: (makes: VehicleMake[], makeId: string, fn: (m: VehicleMake) => VehicleMake) =>
    makes.map((m) => (m.id === makeId ? fn(m) : m)),
  updateModel: (makes: VehicleMake[], makeId: string, modelId: string, fn: (m: VehicleModel) => VehicleModel) =>
    vehicles.updateMake(makes, makeId, (make) => ({ ...make, models: make.models.map((m) => (m.id === modelId ? fn(m) : m)) })),
};

/** An id built from the name ("bmw-3-series"), suffixed if it's already taken. */
export function idFrom(text: string, taken: Iterable<string>) {
  const base = slugify(text) || newId("v");
  return new Set(taken).has(base) ? newId(base) : base;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
