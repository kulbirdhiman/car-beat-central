CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`vehicle` text NOT NULL,
	`preferred_date` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`buy_qty` integer NOT NULL,
	`get_qty` integer NOT NULL,
	`min_order` integer NOT NULL,
	`max_discount` integer,
	`scope` text NOT NULL,
	`product_ids` text NOT NULL,
	`department_ids` text NOT NULL,
	`model_ids` text NOT NULL,
	`first_order_only` integer NOT NULL,
	`usage_limit` integer,
	`used` integer DEFAULT 0 NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`active` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `deals` (
	`product_id` text PRIMARY KEY NOT NULL,
	`deal_price` integer NOT NULL,
	`claimed` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`active` integer NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_slug_unique` ON `departments` (`slug`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`highlight` text NOT NULL,
	`image` text NOT NULL,
	`href` text NOT NULL,
	`coupon_id` text,
	`starts_at` text,
	`ends_at` text,
	`active` integer NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`unit_price` integer NOT NULL,
	`qty` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_items_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`status` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`suburb` text NOT NULL,
	`state` text NOT NULL,
	`postcode` text NOT NULL,
	`delivery` text NOT NULL,
	`coupon` text,
	`subtotal` integer NOT NULL,
	`discount` integer NOT NULL,
	`shipping` integer NOT NULL,
	`total` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_created` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_email` ON `orders` (`email`);--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`vehicle` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_reviews_product` ON `product_reviews` (`product_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`rrp` integer NOT NULL,
	`rating` real NOT NULL,
	`reviews` integer NOT NULL,
	`fits` text NOT NULL,
	`badge` text,
	`image` text NOT NULL,
	`description` text NOT NULL,
	`features` text NOT NULL,
	`trending_rank` integer,
	`sku` text DEFAULT '' NOT NULL,
	`department_id` text,
	`stock` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_status_category` ON `products` (`status`,`category`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`email` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicle_makes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`country` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` text PRIMARY KEY NOT NULL,
	`make_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`make_id`) REFERENCES `vehicle_makes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_models_make` ON `vehicle_models` (`make_id`,`position`);--> statement-breakpoint
CREATE TABLE `vehicle_submodels` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`years` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `vehicle_models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_submodels_model` ON `vehicle_submodels` (`model_id`,`position`);