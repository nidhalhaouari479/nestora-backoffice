import type { NavIcon } from "@/lib/auth/permissions";

// Navigation shown by the shell (team portal or client portal).
export type NavItem = { href: string; label: string; icon: NavIcon; badge?: number | null; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export function isActive(item: NavItem, pathname: string) {
  return pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
}

export function findActive(groups: NavGroup[], pathname: string) {
  for (const group of groups) {
    const item = group.items.find((candidate) => isActive(candidate, pathname));
    if (item) return { group, item };
  }
  return null;
}
