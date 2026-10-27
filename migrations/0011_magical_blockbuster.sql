ALTER TABLE "products" ADD COLUMN "option_groups" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb NOT NULL;