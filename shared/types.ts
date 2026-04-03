/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

import type { users } from "../drizzle/schema";

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type UserRole = (typeof users.$inferSelect)["role"];
