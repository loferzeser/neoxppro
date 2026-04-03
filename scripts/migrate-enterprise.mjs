/**
 * Run enterprise migration manually
 * Usage: node scripts/migrate-enterprise.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const sql = `
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`phone\` varchar(32) AFTER \`email\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`avatarUrl\` text AFTER \`phone\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`timezone\` varchar(64) DEFAULT 'Asia/Bangkok' AFTER \`avatarUrl\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`locale\` varchar(16) DEFAULT 'th' AFTER \`timezone\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`isVerified\` boolean NOT NULL DEFAULT false AFTER \`locale\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`isBanned\` boolean NOT NULL DEFAULT false AFTER \`isVerified\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`bannedReason\` text AFTER \`isBanned\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`deletedAt\` timestamp AFTER \`bannedReason\`;
ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`metadata\` json DEFAULT ('{}') AFTER \`deletedAt\`;

ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`couponId\` int AFTER \`notes\`;
ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`discountAmount\` decimal(10,2) DEFAULT 0.00 AFTER \`couponId\`;
ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`affiliateCode\` varchar(32) AFTER \`discountAmount\`;
ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`orgId\` int AFTER \`affiliateCode\`;
ALTER TABLE \`orders\` ADD COLUMN IF NOT EXISTS \`deletedAt\` timestamp AFTER \`paidAt\`;

CREATE TABLE IF NOT EXISTS \`organizations\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`slug\` varchar(64) NOT NULL UNIQUE,
  \`name\` varchar(255) NOT NULL,
  \`logoUrl\` text,
  \`plan\` enum('free','starter','pro','enterprise') NOT NULL DEFAULT 'free',
  \`maxSeats\` int NOT NULL DEFAULT 5,
  \`isActive\` boolean NOT NULL DEFAULT true,
  \`ownerId\` int NOT NULL,
  \`metadata\` json DEFAULT ('{}'),
  \`deletedAt\` timestamp,
  \`createdAt\` timestamp NOT NULL DEFAULT NOW(),
  \`updatedAt\` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS \`org_members\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`orgId\` int NOT NULL,
  \`userId\` int NOT NULL,
  \`role\` enum('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
  \`invitedBy\` int,
  \`joinedAt\` timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \`coupons\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`code\` varchar(64) NOT NULL UNIQUE,
  \`description\` text,
  \`discountType\` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  \`discountValue\` decimal(10,2) NOT NULL,
  \`minOrderAmount\` decimal(10,2),
  \`maxDiscountAmount\` decimal(10,2),
  \`usageLimit\` int,
  \`usageCount\` int NOT NULL DEFAULT 0,
  \`perUserLimit\` int NOT NULL DEFAULT 1,
  \`isActive\` boolean NOT NULL DEFAULT true,
  \`startsAt\` timestamp,
  \`expiresAt\` timestamp,
  \`createdBy\` int,
  \`createdAt\` timestamp NOT NULL DEFAULT NOW(),
  \`updatedAt\` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS \`coupon_usages\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`couponId\` int NOT NULL,
  \`userId\` int NOT NULL,
  \`orderId\` int NOT NULL,
  \`discountAmount\` decimal(10,2) NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \`affiliates\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`userId\` int NOT NULL UNIQUE,
  \`code\` varchar(32) NOT NULL UNIQUE,
  \`commissionRate\` decimal(5,2) NOT NULL DEFAULT 10.00,
  \`totalEarned\` decimal(12,2) NOT NULL DEFAULT 0.00,
  \`totalPaid\` decimal(12,2) NOT NULL DEFAULT 0.00,
  \`status\` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
  \`payoutMethod\` varchar(64),
  \`payoutDetails\` json DEFAULT ('{}'),
  \`createdAt\` timestamp NOT NULL DEFAULT NOW(),
  \`updatedAt\` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS \`affiliate_conversions\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`affiliateId\` int NOT NULL,
  \`referredUserId\` int,
  \`orderId\` int,
  \`commissionAmount\` decimal(10,2) NOT NULL,
  \`status\` enum('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
  \`paidAt\` timestamp,
  \`createdAt\` timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \`email_queue\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`to\` varchar(320) NOT NULL,
  \`subject\` varchar(500) NOT NULL,
  \`template\` varchar(128) NOT NULL,
  \`payload\` json DEFAULT ('{}'),
  \`status\` enum('queued','sent','failed','skipped') NOT NULL DEFAULT 'queued',
  \`attempts\` int NOT NULL DEFAULT 0,
  \`lastError\` text,
  \`scheduledAt\` timestamp NOT NULL DEFAULT NOW(),
  \`sentAt\` timestamp,
  \`createdAt\` timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`userId\` int NOT NULL,
  \`type\` varchar(64) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`body\` text,
  \`link\` varchar(512),
  \`isRead\` boolean NOT NULL DEFAULT false,
  \`metadata\` json DEFAULT ('{}'),
  \`createdAt\` timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \`ip_blocklist\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`ip\` varchar(64) NOT NULL UNIQUE,
  \`reason\` text,
  \`blockedBy\` int,
  \`expiresAt\` timestamp,
  \`createdAt\` timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` int AUTO_INCREMENT PRIMARY KEY,
  \`userId\` int,
  \`orgId\` int,
  \`action\` varchar(255) NOT NULL,
  \`resource\` varchar(128) NOT NULL,
  \`resourceId\` varchar(128),
  \`before\` json,
  \`after\` json,
  \`ipAddress\` varchar(64),
  \`userAgent\` text,
  \`severity\` enum('info','warn','critical') NOT NULL DEFAULT 'info',
  \`createdAt\` timestamp NOT NULL DEFAULT NOW()
);
`;

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Connected to MySQL");
  
  const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
  
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      console.log("✓", stmt.slice(0, 60).replace(/\n/g, " "));
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⚠ already exists, skipping");
      } else {
        console.error("✗ Error:", err.message);
      }
    }
  }
  
  await conn.end();
  console.log("Migration complete!");
}

run().catch(console.error);
