import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { VehicleMake } from "@/lib/admin/model";
import { db, transaction, type Tx } from "../db";
import { products, vehicleMakes, vehicleModels, vehicleSubmodels } from "../schema";
import { nextPosition, reorder } from "./catalog";
import { AdminError, type VehicleInput, type VehicleLevel } from "./validate";

/** Makes → models → sub-models, each level in admin order. Three queries, assembled in memory. */
export async function listVehicleMakes(): Promise<VehicleMake[]> {
  const [makes, models, subs] = await Promise.all([
    db
      .select({ id: vehicleMakes.id, name: vehicleMakes.name, description: vehicleMakes.description, country: vehicleMakes.country, createdAt: vehicleMakes.createdAt })
      .from(vehicleMakes)
      .orderBy(vehicleMakes.position),
    db.select().from(vehicleModels).orderBy(vehicleModels.position),
    db.select().from(vehicleSubmodels).orderBy(vehicleSubmodels.position),
  ]);

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
export async function saveVehicle(level: VehicleLevel, v: VehicleInput) {
  const { id, name, description } = v;
  if (level === "makes") {
    const fields = { name, description, country: v.extra };
    await db
      .insert(vehicleMakes)
      .values({ id, ...fields, position: nextPosition(vehicleMakes) })
      .onConflictDoUpdate({ target: vehicleMakes.id, set: fields });
    return;
  }

  const parentId = v.parentId!;
  if (level === "models") {
    const [make] = await db.select({ id: vehicleMakes.id }).from(vehicleMakes).where(eq(vehicleMakes.id, parentId));
    if (!make) throw new AdminError("That make doesn't exist.", 404);
    const [current] = await db.select({ parentId: vehicleModels.makeId }).from(vehicleModels).where(eq(vehicleModels.id, id));
    if (current && current.parentId !== parentId) throw new AdminError("That id is already used under another make.", 409);
    await db
      .insert(vehicleModels)
      .values({ id, makeId: parentId, name, description, position: nextPosition(vehicleModels, sql`make_id = ${parentId}`) })
      .onConflictDoUpdate({ target: vehicleModels.id, set: { name, description } });
  } else {
    const [model] = await db.select({ id: vehicleModels.id }).from(vehicleModels).where(eq(vehicleModels.id, parentId));
    if (!model) throw new AdminError("That model doesn't exist.", 404);
    const [current] = await db.select({ parentId: vehicleSubmodels.modelId }).from(vehicleSubmodels).where(eq(vehicleSubmodels.id, id));
    if (current && current.parentId !== parentId) throw new AdminError("That id is already used under another model.", 409);
    const fields = { name, description, years: v.extra };
    await db
      .insert(vehicleSubmodels)
      .values({ id, modelId: parentId, ...fields, position: nextPosition(vehicleSubmodels, sql`model_id = ${parentId}`) })
      .onConflictDoUpdate({ target: vehicleSubmodels.id, set: fields });
  }
}

/**
 * Deletes a vehicle and everything under it (foreign keys cascade). Products lose fitment
 * to any deleted model, so they don't point at models that no longer exist.
 */
export async function deleteVehicle(level: VehicleLevel, id: string) {
  await transaction(async (tx) => {
    const modelIds =
      level === "makes"
        ? (await tx.select({ id: vehicleModels.id }).from(vehicleModels).where(eq(vehicleModels.makeId, id))).map((m) => m.id)
        : level === "models"
          ? [id]
          : [];
    const table = TABLE[level];
    const deleted = await tx.delete(table).where(eq(table.id, id)).returning({ id: table.id });
    if (deleted.length === 0) throw new AdminError("Vehicle not found.", 404);
    if (modelIds.length) await removeFitment(tx, modelIds);
  });
}

async function removeFitment(tx: Tx, modelIds: string[]) {
  const gone = sql`ARRAY[${sql.join(
    modelIds.map((m) => sql`${m}`),
    sql`, `,
  )}]::text[]`;
  // Rewrites each affected product's fits array without the deleted models.
  await tx
    .update(products)
    .set({ fits: sql`(SELECT COALESCE(jsonb_agg(value), '[]'::jsonb) FROM jsonb_array_elements_text(${products.fits}) AS value WHERE value <> ALL(${gone}))` })
    .where(and(sql`jsonb_typeof(${products.fits}) = 'array'`, sql`${products.fits} ?| ${gone}`));
}

export function reorderVehicles(level: VehicleLevel, ids: string[]) {
  return reorder(TABLE[level], ids);
}
