/**
 * Run enterprise migration manually
 * Usage: node scripts/migrate-enterprise.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function columnExists(conn, table, column) {
  const dbName = new URL(process.env.DATABASE_URL.replace("mysql://", "http://")).pathname.slice(1);
  const [rows] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  return rows[0].cnt > 0;
}

async function addColumnIfMissing(conn, table, column, definition) {
  const exists = await columnExists(conn, table, column);
  if (exists) {
    console.log(`⚠ ${table}.${column} already exists, skipping`);
    return;
  }
  await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`✓ Added ${table}.${column}`);
}

const createTables = `
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
  \`deletedAt\` timestamp NULL,
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
  \`startsAt\` timestamp NULL,
  \`expiresAt\` timestamp NULL,
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
  \`paidAt\` timestamp NULL,
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
  \`sentAt\` timestamp NULL,
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
  \`expiresAt\` timestamp NULL,
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

  // --- ALTER TABLE: users ---
  await addColumnIfMissing(conn, "users", "phone", "varchar(32) NULL AFTER `email`");
  await addColumnIfMissing(conn, "users", "avatarUrl", "text NULL AFTER `phone`");
  await addColumnIfMissing(conn, "users", "timezone", "varchar(64) DEFAULT 'Asia/Bangkok' AFTER `avatarUrl`");
  await addColumnIfMissing(conn, "users", "locale", "varchar(16) DEFAULT 'th' AFTER `timezone`");
  await addColumnIfMissing(conn, "users", "isVerified", "boolean NOT NULL DEFAULT false AFTER `locale`");
  await addColumnIfMissing(conn, "users", "isBanned", "boolean NOT NULL DEFAULT false AFTER `isVerified`");
  await addColumnIfMissing(conn, "users", "bannedReason", "text NULL AFTER `isBanned`");
  await addColumnIfMissing(conn, "users", "deletedAt", "timestamp NULL AFTER `bannedReason`");
  await addColumnIfMissing(conn, "users", "metadata", "json NULL AFTER `deletedAt`");

  // --- ALTER TABLE: orders ---
  await addColumnIfMissing(conn, "orders", "couponId", "int NULL AFTER `notes`");
  await addColumnIfMissing(conn, "orders", "discountAmount", "decimal(10,2) DEFAULT 0.00 AFTER `couponId`");
  await addColumnIfMissing(conn, "orders", "affiliateCode", "varchar(32) NULL AFTER `discountAmount`");
  await addColumnIfMissing(conn, "orders", "orgId", "int NULL AFTER `affiliateCode`");
  await addColumnIfMissing(conn, "orders", "deletedAt", "timestamp NULL AFTER `paidAt`");

  // --- CREATE new tables ---
  const statements = createTables.split(";").map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      console.log("✓", stmt.slice(0, 60).replace(/\n/g, " "));
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR" || err.code === "ER_DUP_KEYNAME") {
        console.log("⚠ already exists, skipping");
      } else {
        console.warn("✗ Error:", err.message.slice(0, 120));
      }
    }
  }

  await conn.end();
  console.log("Migration complete!");
}

run().catch(console.error);
