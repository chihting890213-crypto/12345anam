CREATE TABLE `bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankName` varchar(128) NOT NULL,
	`accountNumber` varchar(64) NOT NULL,
	`accountName` varchar(128) NOT NULL,
	`branchName` varchar(128),
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flower_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flower_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flowers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folderId` int,
	`name` varchar(128) NOT NULL,
	`description` text,
	`price` decimal(10,2),
	`unit` varchar(32) NOT NULL DEFAULT '束',
	`category` enum('holiday','other') NOT NULL DEFAULT 'other',
	`isCustom` boolean NOT NULL DEFAULT false,
	`imageUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flowers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`senderType` enum('staff','customer') NOT NULL,
	`senderName` varchar(128),
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`senderName` varchar(128) NOT NULL,
	`senderPhone` varchar(32) NOT NULL,
	`senderEmail` varchar(320),
	`taxId` varchar(16),
	`recipientName` varchar(128) NOT NULL,
	`recipientPhone` varchar(32) NOT NULL,
	`recipientAddress` text,
	`deliveryType` enum('pickup','delivery') NOT NULL,
	`regionId` int,
	`deliveryDate` varchar(10),
	`timeslot` varchar(32),
	`flowerId` int,
	`flowerName` varchar(128),
	`flowerQuantity` decimal(10,2) DEFAULT '1',
	`flowerUnit` varchar(32) DEFAULT '束',
	`customFlowerPrice` decimal(10,2),
	`flowerPrice` decimal(10,2),
	`needCard` boolean NOT NULL DEFAULT false,
	`cardContent` text,
	`cardPrice` decimal(10,2) DEFAULT '0',
	`category` enum('holiday','other') NOT NULL DEFAULT 'other',
	`categoryNote` text,
	`totalAmount` decimal(10,2) DEFAULT '0',
	`status` enum('pending','confirmed','awaiting_payment','paid','processing','completed','cancelled','fully_booked') NOT NULL DEFAULT 'pending',
	`paymentNote` text,
	`bankAccountId` int,
	`createdByStaff` boolean NOT NULL DEFAULT false,
	`staffId` int,
	`internalNote` text,
	`extraFields` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`area` enum('north','central','south','east') NOT NULL,
	`deliveryFee` decimal(10,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`displayName` varchar(128),
	`role` enum('admin','staff') NOT NULL DEFAULT 'staff',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `timeslot_capacities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`timeslot` varchar(32) NOT NULL,
	`category` enum('holiday','other','all') NOT NULL DEFAULT 'all',
	`maxCapacity` int NOT NULL,
	`currentCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeslot_capacities_id` PRIMARY KEY(`id`)
);
