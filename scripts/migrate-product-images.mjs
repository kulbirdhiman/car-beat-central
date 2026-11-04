import nextEnv from '@next/env';
import postgres from 'postgres';
import { isOwnedImage, storeProductImages } from '../lib/server/product-images.mjs';

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes('--apply');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 8 });
let failed = 0;
try {
  const rows = await sql`SELECT id, image, images FROM products ORDER BY id`;
  const pending = rows.filter((p) => [p.image, ...p.images].some((url) => !isOwnedImage(url)));
  console.log(`${apply ? 'Migrating' : 'Dry run:'} ${pending.length} of ${rows.length} products need image copies.`);
  async function migrate(product) {
    if (!apply) { console.log(`Would migrate ${product.id}`); return; }
    try {
      const copied = await storeProductImages(product);
      // Avoid overwriting image edits made while the download was running.
      const updated = await sql`UPDATE products SET image = ${copied.image}, images = ${sql.json(copied.images)} WHERE id = ${product.id} AND image = ${product.image} AND images = ${sql.json(product.images)} RETURNING id`;
      if (!updated.length) throw new Error('Product changed during migration; rerun to retry.');
      console.log(`Migrated ${product.id}`);
    } catch (error) { failed++; console.error(`Failed ${product.id}: ${error.message}`); }
  }
  for (let index = 0; index < pending.length; index += 3) {
    await Promise.all(pending.slice(index, index + 3).map(migrate));
  }
  const remaining = await sql`SELECT image, images FROM products`;
  const count = remaining.filter((p) => [p.image, ...p.images].some((url) => !isOwnedImage(url))).length;
  console.log(`${count} products still have images outside our storage. ${failed} failures.`);
  if (apply && count) process.exitCode = 1;
} finally { await sql.end(); }
