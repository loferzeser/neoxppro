import { cn } from "@/lib/utils";
import type { UserRole } from "@shared/types";

const roleStyles: Record<UserRole, string> = {
  user: "bg-zinc-600/30 text-zinc-200 border-zinc-500/40",
  service: "bg-blue-600/25 text-blue-200 border-blue-500/40",
  admin: "bg-amber-500/25 text-amber-200 border-amber-400/40",
  super_admin: "bg-orange-600/30 text-orange-200 border-orange-500/50",
  developer: "bg-[rgba(204,255,0,0.15)] text-[#ccff00] border-[rgba(204,255,0,0.45)]",
};

const roleLabels: Record<UserRole, string> = {
  user: "User",
  service: "Service",
  admin: "Admin",
  super_admin: "Super Admin",
  developer: "Developer",
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        roleStyles[role] ?? roleStyles.user,
        className
      )}
    >
      {roleLabels[role] ?? role}
    </span>
  );
}
