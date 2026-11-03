import { requireStaff } from "@/lib/auth/session";
import { NAV_GROUPS } from "@/lib/auth/permissions";
import { formatToday, getNavCounts } from "@/lib/ops";
import { PortalShell } from "@/components/portal/PortalShell";
import type { NavGroup } from "@/components/portal/nav";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const staff = await requireStaff();
  const counts = await getNavCounts(staff.permissions);
  const groups: NavGroup[] = NAV_GROUPS
    .map((group) => ({
      label: group.label,
      items: group.sections
        .filter((section) => staff.permissions.includes(section.permission))
        .map((section) => ({ href: `/${section.slug}`, label: section.label, icon: section.icon, badge: section.badge ? counts[section.badge] : null })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <PortalShell
      groups={groups}
      user={{ name: staff.fullName, roleLabel: staff.roleLabel }}
      today={formatToday()}
      brandSubtitle="Ops"
      logoutHref="/api/auth/logout"
      fallbackTitle="Nestora Ops"
      notifications={{ count: counts.urgent, href: "/actions", label: "Actions urgentes" }}
      searchPermissions={staff.permissions}
    >
      {children}
    </PortalShell>
  );
}
