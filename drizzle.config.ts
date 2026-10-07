import { defineConfig } from "drizzle-kit";

/**
 * `npm run db:generate` writes migrations from lib/server/schema.ts into migrations/;
 * `npm run db:migrate` applies them to Supabase. Migrations use DIRECT_URL (the session pooler or direct
 * connection) when set, since the transaction pooler the app uses doesn't support everything drizzle-kit does.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/server/schema.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
