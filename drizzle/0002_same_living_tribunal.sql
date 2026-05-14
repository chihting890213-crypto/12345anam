DROP TABLE `regions`;--> statement-breakpoint
ALTER TABLE `flowers` MODIFY COLUMN `price` int;--> statement-breakpoint
ALTER TABLE `flowers` MODIFY COLUMN `category` enum('holiday','wedding','funeral','other') NOT NULL DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `flowerQuantity` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `customFlowerPrice` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `flowerPrice` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `cardPrice` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `cardPrice` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `category` enum('holiday','wedding','funeral','other') NOT NULL DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `totalAmount` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `totalAmount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `timeslot_capacities` MODIFY COLUMN `category` enum('holiday','wedding','funeral','other','all') NOT NULL DEFAULT 'all';--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `regionId`;