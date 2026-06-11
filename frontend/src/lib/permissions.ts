import type { Role } from "@/types/domain";

export const routePermissions: Record<string, Role[]> = {
  "/": ["super_admin", "finance", "marketing", "director"],
  "/master-data": ["super_admin", "finance"],
  "/packages": ["super_admin", "finance", "marketing"],
  "/simulations": ["super_admin", "finance", "marketing", "director"],
  "/proposal": ["super_admin", "marketing", "director"],
  "/audit-logs": ["super_admin"],
};

export function canAccessRoute(role: Role | null, path: string) {
  if (!role) {
    return false;
  }

  const allowedRoles = routePermissions[path];
  if (!allowedRoles) {
    return true;
  }

  return allowedRoles.includes(role);
}
