ALTER TABLE `departments` ADD `parent_id` text;--> statement-breakpoint
CREATE INDEX `departments_parent` ON `departments` (`parent_id`,`position`);