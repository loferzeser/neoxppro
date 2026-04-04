import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("Creating admin user...");

const adminEmail = "admin@neoxp.shop";
const adminName = "Admin User";

// Check if admin already exists
const existing = await db.select().from(users).where(eq(users.email, adminEmail));

if (existing.length > 0) {
  console.log("Admin user already exists, updating role...");
  await db.update(users)
    .set({ 
      role: "super_admin",
      isVerified: true,
      isBanned: false
    })
    .where(eq(users.email, adminEmail));
  console.log("✓ Admin user updated!");
} else {
  console.log("Creating new admin user...");
  await db.insert(users).values({
    email: adminEmail,
    name: adminName,
    role: "super_admin",
    isVerified: true,
    isBanned: false,
    createdAt: new Date(),
  });
  console.log("✓ Admin user created!");
}

console.log("\n=== Admin Credentials ===");
console.log("Email:", adminEmail);
console.log("Login via Google OAuth with this email");
console.log("========================\n");

await connection.end();
process.exit(0);
