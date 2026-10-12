CREATE TABLE "customer_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"suburb" text NOT NULL,
	"state" text NOT NULL,
	"postcode" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "user_id" text;--> statement-breakpoint
CREATE INDEX "customer_addresses_user" ON "customer_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_user" ON "orders" USING btree ("user_id");