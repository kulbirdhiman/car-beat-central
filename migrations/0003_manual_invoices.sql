ALTER TABLE "orders" ADD COLUMN "source" text DEFAULT 'checkout' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_methods" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note" text;