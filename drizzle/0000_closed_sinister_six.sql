CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`time` text NOT NULL,
	`difficulty` text,
	`ingredientIds` text NOT NULL,
	`ingredientsList` text NOT NULL,
	`steps` text NOT NULL,
	`createdAt` integer NOT NULL
);
