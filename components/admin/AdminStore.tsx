"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AdminProduct, Coupon, Department, Offer, SubModel, VehicleMake, VehicleModel } from "@/lib/admin/model";
import type { AdminData } from "@/lib/server/admin/data";
import type { OrderStatus } from "@/lib/types";

/**
 * Admin data, shared by every admin page. The layout loads it from the database on the server;
 * each change updates this state straight away (so the UI feels instant) and is then saved through
 * the admin API. If a save fails, the error is shown and everything is reloaded from the server.
 */

type MakeFields = Pick<VehicleMake, "id" | "name" | "description" | "country">;
type ModelFields = Pick<VehicleModel, "id" | "name" | "description">;
type SubModelFields = Pick<SubModel, "id" | "name" | "description" | "years">;

type Store = AdminData & {
  saveDepartment: (d: Department) => void;
  deleteDepartment: (id: string) => void;
  /** Reorders one group of siblings: the top-level departments, or one department's sub-departments. */
  reorderDepartments: (siblings: Department[]) => void;
  saveProduct: (p: AdminProduct) => void;
  deleteProduct: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  saveMake: (make: MakeFields) => void;
  deleteMake: (id: string) => void;
  reorderMakes: (makes: VehicleMake[]) => void;
  saveModel: (makeId: string, model: ModelFields) => void;
  deleteModel: (makeId: string, id: string) => void;
  reorderModels: (makeId: string, models: VehicleModel[]) => void;
  saveSubModel: (makeId: string, modelId: string, sub: SubModelFields) => void;
  deleteSubModel: (makeId: string, modelId: string, id: string) => void;
  reorderSubModels: (makeId: string, modelId: string, subs: SubModel[]) => void;
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

/** Calls the admin API; rejects with the server's error message. */
async function api<T = unknown>(method: "GET" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `The server couldn't save that (error ${res.status}).`);
  return data as T;
}

const ids = (rows: { id: string }[]) => ({ ids: rows.map((r) => r.id) });

export function AdminStoreProvider({ initial, children }: { initial: AdminData; children: React.ReactNode }) {
  const [departments, setDepartments] = useState(initial.departments);
  const [makes, setMakes] = useState(initial.makes);
  const [products, setProducts] = useState(initial.products);
  const [orders, setOrders] = useState(initial.orders);
  const [offers, setOffers] = useState(initial.offers);
  const [coupons, setCoupons] = useState(initial.coupons);

  const store = useMemo<Store>(() => {
    /** Reloads everything, so the screen matches the database again after a failed save. */
    async function resync() {
      try {
        const data = await api<AdminData>("GET", "");
        setDepartments(data.departments);
        setMakes(data.makes);
        setProducts(data.products);
        setOrders(data.orders);
        setOffers(data.offers);
        setCoupons(data.coupons);
      } catch {
        toast.error("Couldn't reload admin data. Refresh the page.");
      }
    }

    /** Sends a request whose change is already on screen. `done` gets the server's response. */
    function save<T>(request: Promise<T>, { success, done }: { success?: string; done?: (result: T) => void } = {}) {
      request.then(
        (result) => {
          done?.(result);
          if (success) toast.success(success);
        },
        (error: Error) => {
          toast.error(error.message);
          void resync();
        },
      );
    }

    const updateMake = (id: string, fn: (m: VehicleMake) => VehicleMake) => setMakes((list) => list.map((m) => (m.id === id ? fn(m) : m)));
    const updateModel = (makeId: string, id: string, fn: (m: VehicleModel) => VehicleModel) =>
      updateMake(makeId, (make) => ({ ...make, models: make.models.map((m) => (m.id === id ? fn(m) : m)) }));
    /** Products lose fitment to deleted models, as on the server. */
    const dropFitment = (modelIds: string[]) =>
      setProducts((list) => list.map((p) => (p.fits === "universal" ? p : { ...p, fits: p.fits.filter((id) => !modelIds.includes(id)) })));
    const now = () => new Date().toISOString();

    return {
      departments,
      makes,
      products,
      orders,
      offers,
      coupons,

      saveDepartment: (d) => {
        setDepartments((list) => upsert(list, d, "end"));
        save(api<Department>("PUT", `/departments/${d.id}`, d), {
          success: `Saved ${d.name}.`,
          done: (saved) => setDepartments((list) => upsert(list, saved, "end")),
        });
      },
      deleteDepartment: (id) => {
        // Its sub-departments go with it, as on the server.
        const gone = new Set([id, ...departments.filter((d) => d.parentId === id).map((d) => d.id)]);
        setDepartments((list) => list.filter((d) => !gone.has(d.id)));
        setProducts((list) => list.map((p) => (gone.has(p.departmentId) ? { ...p, departmentId: "" } : p)));
        save(api("DELETE", `/departments/${id}`), { success: "Department deleted." });
      },
      reorderDepartments: (siblings) => {
        const group = new Set(siblings.map((d) => d.id));
        let i = 0;
        setDepartments((list) => list.map((d) => (group.has(d.id) ? siblings[i++] : d)));
        save(api("PATCH", "/departments", ids(siblings)));
      },

      saveProduct: (p) => {
        setProducts((list) => upsert(list, p));
        save(api<AdminProduct>("PUT", `/products/${p.id}`, p), {
          success: `Saved ${p.name}.`,
          // The server sets the store URL slug on new products.
          done: (saved) => setProducts((list) => upsert(list, saved)),
        });
      },
      deleteProduct: (id) => {
        setProducts((list) => list.filter((p) => p.id !== id));
        save(api("DELETE", `/products/${id}`), { success: "Product deleted." });
      },

      setOrderStatus: (id, status) => {
        setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
        save(api("PATCH", `/orders/${id}`, { status }), {
          // Cancelling or reinstating changes stock levels, so pick those up.
          done: () => api<AdminProduct[]>("GET", "/products").then(setProducts, () => {}),
        });
      },

      saveMake: (make) => {
        setMakes((list) => (list.some((m) => m.id === make.id) ? list.map((m) => (m.id === make.id ? { ...m, ...make } : m)) : [...list, { ...make, createdAt: now(), models: [] }]));
        save(api("PUT", `/vehicles/makes/${make.id}`, make), { success: `Saved ${make.name}.` });
      },
      deleteMake: (id) => {
        dropFitment(makes.find((m) => m.id === id)?.models.map((m) => m.id) ?? []);
        setMakes((list) => list.filter((m) => m.id !== id));
        save(api("DELETE", `/vehicles/makes/${id}`), { success: "Make deleted." });
      },
      reorderMakes: (rows) => {
        setMakes(rows);
        save(api("PATCH", "/vehicles/makes", ids(rows)));
      },

      saveModel: (makeId, model) => {
        updateMake(makeId, (make) => ({
          ...make,
          models: make.models.some((m) => m.id === model.id)
            ? make.models.map((m) => (m.id === model.id ? { ...m, ...model } : m))
            : [...make.models, { ...model, createdAt: now(), subModels: [] }],
        }));
        save(api("PUT", `/vehicles/models/${model.id}`, { ...model, parentId: makeId }), { success: `Saved ${model.name}.` });
      },
      deleteModel: (makeId, id) => {
        dropFitment([id]);
        updateMake(makeId, (make) => ({ ...make, models: make.models.filter((m) => m.id !== id) }));
        save(api("DELETE", `/vehicles/models/${id}`), { success: "Model deleted." });
      },
      reorderModels: (makeId, rows) => {
        updateMake(makeId, (make) => ({ ...make, models: rows }));
        save(api("PATCH", "/vehicles/models", ids(rows)));
      },

      saveSubModel: (makeId, modelId, sub) => {
        updateModel(makeId, modelId, (model) => ({
          ...model,
          subModels: model.subModels.some((s) => s.id === sub.id)
            ? model.subModels.map((s) => (s.id === sub.id ? { ...s, ...sub } : s))
            : [...model.subModels, { ...sub, createdAt: now() }],
        }));
        save(api("PUT", `/vehicles/submodels/${sub.id}`, { ...sub, parentId: modelId }), { success: `Saved ${sub.name}.` });
      },
      deleteSubModel: (makeId, modelId, id) => {
        updateModel(makeId, modelId, (model) => ({ ...model, subModels: model.subModels.filter((s) => s.id !== id) }));
        save(api("DELETE", `/vehicles/submodels/${id}`), { success: "Sub-model deleted." });
      },
      reorderSubModels: (makeId, modelId, rows) => {
        updateModel(makeId, modelId, (model) => ({ ...model, subModels: rows }));
        save(api("PATCH", "/vehicles/submodels", ids(rows)));
      },

      saveOffer: (o) => {
        setOffers((list) => upsert(list, o, "end"));
        save(api<Offer>("PUT", `/offers/${o.id}`, o), {
          success: `Saved ${o.title}.`,
          done: (saved) => setOffers((list) => upsert(list, saved, "end")),
        });
      },
      deleteOffer: (id) => {
        setOffers((list) => list.filter((o) => o.id !== id));
        save(api("DELETE", `/offers/${id}`), { success: "Offer deleted." });
      },
      setOffers: (rows) => {
        setOffers(rows);
        save(api("PATCH", "/offers", ids(rows)));
      },

      saveCoupon: (c) => {
        setCoupons((list) => upsert(list, c));
        save(api<Coupon>("PUT", `/coupons/${c.id}`, c), {
          success: `Saved ${c.code}.`,
          done: (saved) => setCoupons((list) => upsert(list, saved)),
        });
      },
      // Offers that showed this coupon keep running, just without a code.
      deleteCoupon: (id) => {
        setCoupons((list) => list.filter((c) => c.id !== id));
        setOffers((list) => list.map((o) => (o.couponId === id ? { ...o, couponId: null } : o)));
        save(api("DELETE", `/coupons/${id}`), { success: "Coupon deleted." });
      },
    };
  }, [departments, makes, products, orders, offers, coupons]);

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

/** An id built from the name ("bmw-3-series"), suffixed if it's already taken. */
export function idFrom(text: string, taken: Iterable<string>) {
  const base = slugify(text).slice(0, 50).replace(/-$/, "") || newId("v");
  return new Set(taken).has(base) ? newId(base) : base;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
