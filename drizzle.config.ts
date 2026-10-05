import { defineConfig } from "drizzle-kit";

/** `npm run db:generate` writes migrations from lib/server/schema.ts; the app applies them on startup. */
export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/server/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_PATH ?? "./data/carbeat.db" },
});
