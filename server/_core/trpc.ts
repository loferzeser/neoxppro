import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import type { UserRole } from "@shared/types";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/** Throws FORBIDDEN if current user's role is not in the allowed list */
export function requireRole(...allowed: UserRole[]) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!allowed.includes(ctx.user.role as UserRole)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

/** Dashboard + stats: service, admin, super_admin, developer */
export const dashboardProcedure = protectedProcedure.use(
  requireRole("service", "admin", "super_admin", "developer")
);

/** Products CRUD: admin, super_admin, developer */
export const productAdminProcedure = protectedProcedure.use(
  requireRole("admin", "super_admin", "developer")
);

/** User & role management: super_admin, developer */
export const userAdminProcedure = protectedProcedure.use(requireRole("super_admin", "developer"));

/** Developer Console: developer only */
export const developerProcedure = protectedProcedure.use(requireRole("developer"));

/** System settings (non-dev): super_admin, developer */
export const systemSettingsProcedure = protectedProcedure.use(requireRole("super_admin", "developer"));

/** Legacy name: same as product admin for shop management */
export const adminProcedure = productAdminProcedure;
