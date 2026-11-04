# Product image migration

Product saves (including CSV/XLSX imports) now download external HTTPS images into the configured public Supabase bucket before writing either image field. A failed image copy fails that product row; retry the row after fixing its source. Existing URLs in our configured bucket are reused; bundled site image paths are preserved. Images are limited to 5 MB and JPG, PNG, WebP, AVIF or GIF. Downloads have a timeout, bounded redirects, and public-address checks.

Run from the repository root with Node 20+ and the same environment as the app (`.env.local` / `.env` are loaded):

```
node scripts/migrate-product-images.mjs
node scripts/migrate-product-images.mjs --apply
```

The first command only audits. The second uploads images and updates existing products, including drafts. Requires `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a public bucket named `SUPABASE_STORAGE_BUCKET` (default `images`). No schema change is needed.

The script preserves gallery order and duplicate entries. Content hashes make uploads reusable across reruns. Each product updates only after all its images copy successfully, and concurrent image edits prevent its update. Failed products are logged by ID and processing continues; a nonzero exit means external URLs remain. Fix unavailable source images and rerun. Uploaded objects may remain unused after a failed row or database write.

After applying, rerun the audit: acceptance is `0 products still have images outside our storage`. This checks all external hosts, including eBay and CloudFront. Restart/redeploy the app or invalidate storefront caches after the migration so cached pages use the new URLs.

Focused checks:

```
node --test scripts/product-images.test.mjs
```
