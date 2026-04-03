CREATE TABLE `product_assets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `productId` int NOT NULL,
  `fileKey` text NOT NULL,
  `fileUrl` text,
  `version` varchar(64) NOT NULL,
  `checksum` varchar(128),
  `notes` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `product_assets_id` PRIMARY KEY(`id`)
);

CREATE TABLE `product_licenses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderItemId` int NOT NULL,
  `licenseKey` varchar(128) NOT NULL,
  `seats` int NOT NULL DEFAULT 1,
  `status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
  `expiresAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `product_licenses_id` PRIMARY KEY(`id`),
  CONSTRAINT `product_licenses_licenseKey_unique` UNIQUE(`licenseKey`)
);

CREATE TABLE `webhook_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `provider` varchar(64) NOT NULL,
  `eventId` varchar(255) NOT NULL,
  `payloadHash` varchar(128),
  `status` enum('received','processed','failed','retried') NOT NULL DEFAULT 'received',
  `retryCount` int NOT NULL DEFAULT 0,
  `lastError` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE `integration_health_checks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `service` varchar(64) NOT NULL,
  `lastStatus` enum('ok','warn','error') NOT NULL DEFAULT 'warn',
  `diagnostics` text,
  `lastCheckedAt` timestamp,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `integration_health_checks_id` PRIMARY KEY(`id`),
  CONSTRAINT `integration_health_checks_service_unique` UNIQUE(`service`)
);

