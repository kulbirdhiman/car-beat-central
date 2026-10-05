import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { VehicleMake } from "@/lib/admin/model";
import { db, transaction, type Tx } from "../db";
import { products, vehicleMakes, vehicleModels, vehicleSubmodels } from "../schema";
import { nextPosition, reorder } from "./catalog";
import { AdminError, type VehicleInput, type VehicleLevel } from "./validate";

/** Makes → models → sub-models, each level in admin order. Three queries, assembled in memory. */
export function listVehicleMakes(): VehicleMake[] {
  const makes = db
    .select({ id: vehicleMakes.id, name: vehicleMakes.name, description: vehicleMakes.description, country: vehicleMakes.country, createdAt: vehicleMakes.createdAt })
    .from(vehicleMakes)
    .orderBy(vehicleMakes.position)
    .all();
  const models = db.select().from(vehicleModels).orderBy(vehicleModels.position).all();
  const subs = db.select().from(vehicleSubmodels).orderBy(vehicleSubmodels.position).all();

  const subsByModel = Map.groupBy(subs, (s) => s.modelId);
  const modelsByMake = Map.groupBy(models, (m) => m.makeId);
  return makes.map((make) => ({
    ...make,
    models: (modelsByMake.get(make.id) ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      createdAt: m.createdAt,
      subModels: (subsByModel.get(m.id) ?? []).map((s) => ({ id: s.id, name: s.name, description: s.description, years: s.years, createdAt: s.createdAt })),
    })),
  }));
}

const TABLE = { makes: vehicleMakes, models: vehicleModels, submodels: vehicleSubmodels } as const;

/**
 * Creates or updates one make, model or sub-model. Ids are global across a level, so the
 * client can generate them; a new row goes last among its siblings. Moving between parents isn't supported.
 */
export function saveVehicle(level: VehicleLevel, v: VehicleInput) {
  const { id, name, description } = v;
  if (level === "makes") {
    const fields = { name, description, country: v.extra };
    db.insert(vehicleMakes)
      .values({ id, ...fields, position: nextPosition(vehicleMakes) })
      .onConflictDoUpdate({ target: vehicleMakes.id, set: fields })
      .run();
    return;
  }

  const parentId = v.parentId!;
  if (level === "models") {
    if (!db.select({ id: vehicleMakes.id }).from(vehicleMakes).where(eq(vehicleMakes.id, parentId)).get()) throw new AdminError("That make doesn't exist.", 404);
    const current = db.select({ parentId: vehicleModels.makeId }).from(vehicleModels).where(eq(vehicleModels.id, id)).get();
    if (current && current.parentId !== parentId) throw new AdminError("That id is already used under another make.", 409);
    db.insert(vehicleModels)
      .values({ id, makeId: parentId, name, description, position: nextPosition(vehicleModels, sql`make_id = ${parentId}`) })
      .onConflictDoUpdate({ target: vehicleModels.id, set: { name, description } })
      .run();
  } else {
    if (!db.select({ id: vehicleModels.id }).from(vehicleModels).where(eq(vehicleModels.id, parentId)).get()) throw new AdminError("That model doesn't exist.", 404);
    const current = db.select({ parentId: vehicleSubmodels.modelId }).from(vehicleSubmodels).where(eq(vehicleSubmodels.id, id)).get();
    if (current && current.parentId !== parentId) throw new AdminError("That id is already used under another model.", 409);
    const fields = { name, description, years: v.extra };
    db.insert(vehicleSubmodels)
      .values({ id, modelId: parentId, ...fields, position: nextPosition(vehicleSubmodels, sql`model_id = ${parentId}`) })
      .onConflictDoUpdate({ target: vehicleSubmodels.id, set: fields })
      .run();
  }
}

/**
 * Deletes a vehicle and everything under it (foreign keys cascade). Products lose fitment
 * to any deleted model, so they don't point at models that no longer exist.
 */
export function deleteVehicle(level: VehicleLevel, id: string) {
  transaction((tx) => {
    const modelIds =
      level === "makes"
        ? tx.select({ id: vehicleModels.id }).from(vehicleModels).where(eq(vehicleModels.makeId, id)).all().map((m) => m.id)
        : level === "models"
          ? [id]
          : [];
    const table = TABLE[level];
    if (tx.delete(table).where(eq(table.id, id)).run().changes === 0) throw new AdminError("Vehicle not found.", 404);
    if (modelIds.length) removeFitment(tx, modelIds);
  });
}

function removeFitment(tx: Tx, modelIds: string[]) {
  const gone = JSON.stringify(modelIds);
  const fitsGone = sql`EXISTS (SELECT 1 FROM json_each(${products.fits}) WHERE value IN (SELECT value FROM json_each(${gone})))`;
  // Rewrites each affected product's fits array without the deleted models.
  tx.update(products)
    .set({ fits: sql`(SELECT json_group_array(value) FROM json_each(${products.fits}) WHERE value NOT IN (SELECT value FROM json_each(${gone})))` })
    .where(and(sql`${products.fits} != '"universal"'`, fitsGone))
    .run();
}

export function reorderVehicles(level: VehicleLevel, ids: string[]) {
  reorder(TABLE[level], ids);
}
