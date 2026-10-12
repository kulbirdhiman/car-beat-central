import postgres from "postgres";
for (const max of [1, 4]) {
  const sql = postgres(process.env.U, { prepare: false, max });
  let t = Date.now();
  try { for (const q of ["products","departments","vehicle_makes"]) await sql`select count(*) from ${sql(q)}`; console.log("max", max, "serial ok", Date.now()-t, "ms"); } catch (e) { console.log("max", max, "serial", e.message); }
  t = Date.now();
  try { await Promise.all([sql`select count(*) from products`, sql`select count(*) from departments`, sql`select count(*) from vehicle_makes`, sql`select 1`]); console.log("max", max, "parallel ok", Date.now()-t, "ms"); } catch (e) { console.log("max", max, "parallel", e.message); }
  await sql.end({ timeout: 1 });
}
