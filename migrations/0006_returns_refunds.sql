CREATE TABLE "order_refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"created_at" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"provider_refund_id" text,
	"reason" text NOT NULL,
	"restocked" jsonb NOT NULL,
	"return_id" text
);
--> statement-breakpoint
ALTER TABLE "order_refunds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_returns" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"created_at" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"items" jsonb NOT NULL,
	"response" text,
	"resolved_at" text
);
--> statement-breakpoint
ALTER TABLE "order_returns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_return_id_order_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_refunds_order" ON "order_refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_returns_order" ON "order_returns" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_returns_status" ON "order_returns" USING btree ("status");