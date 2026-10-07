CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"vehicle" text NOT NULL,
	"preferred_date" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"buy_qty" integer NOT NULL,
	"get_qty" integer NOT NULL,
	"min_order" integer NOT NULL,
	"max_discount" integer,
	"scope" text NOT NULL,
	"product_ids" jsonb NOT NULL,
	"department_ids" jsonb NOT NULL,
	"model_ids" jsonb NOT NULL,
	"first_order_only" boolean NOT NULL,
	"usage_limit" integer,
	"used" integer DEFAULT 0 NOT NULL,
	"starts_at" text,
	"ends_at" text,
	"active" boolean NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deals" (
	"product_id" text PRIMARY KEY NOT NULL,
	"deal_price" integer NOT NULL,
	"claimed" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"active" boolean NOT NULL,
	"position" integer NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"highlight" text NOT NULL,
	"image" text NOT NULL,
	"href" text NOT NULL,
	"coupon_id" text,
	"starts_at" text,
	"ends_at" text,
	"active" boolean NOT NULL,
	"position" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"unit_price" integer NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1001 CACHE 1),
	"created_at" text NOT NULL,
	"status" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"suburb" text NOT NULL,
	"state" text NOT NULL,
	"postcode" text NOT NULL,
	"delivery" text NOT NULL,
	"coupon" text,
	"subtotal" integer NOT NULL,
	"discount" integer NOT NULL,
	"shipping" integer NOT NULL,
	"total" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"vehicle" text
);
--> statement-breakpoint
ALTER TABLE "product_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"category" text NOT NULL,
	"price" integer NOT NULL,
	"rrp" integer NOT NULL,
	"rating" double precision NOT NULL,
	"reviews" integer NOT NULL,
	"fits" jsonb NOT NULL,
	"badge" text,
	"image" text NOT NULL,
	"description" text NOT NULL,
	"features" jsonb NOT NULL,
	"trending_rank" integer,
	"sku" text DEFAULT '' NOT NULL,
	"department_id" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscribers" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscribers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_makes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"country" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_makes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" text PRIMARY KEY NOT NULL,
	"make_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_submodels" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"years" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_submodels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_make_id_vehicle_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."vehicle_makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_submodels" ADD CONSTRAINT "vehicle_submodels_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "departments_parent" ON "departments" USING btree ("parent_id","position");--> statement-breakpoint
CREATE INDEX "order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_created" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_email" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "product_reviews_product" ON "product_reviews" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "products_status_category" ON "products" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "vehicle_models_make" ON "vehicle_models" USING btree ("make_id","position");--> statement-breakpoint
CREATE INDEX "vehicle_submodels_model" ON "vehicle_submodels" USING btree ("model_id","position");