import { requireLandlord } from "@/lib/auth/landlord";
import { countPendingVisits } from "@/lib/client-portal";
import { formatToday } from "@/lib/ops";
import { PortalShell } from "@/components/portal/PortalShell";
import type { NavGroup } from "@/components/portal/nav";

// Client portal shell: same design as the team portal, with the client's own menu.
export default async function ClientSpaceLayout({ children }: LayoutProps<"/client">) {
  const account = await requireLandlord();
  const pending = await countPendingVisits(account.id);
  const groups: NavGroup[] = [
    {
      label: "Mon espace",
      items: [
        { href: "/client", label: "Tableau de bord", icon: "grid", exact: true },
        { href: "/client/visites", label: "Demandes de visite", icon: "calendar-days", badge: pending },
        { href: "/client/calendrier", label: "Calendrier", icon: "calendar" },
      ],
    },
    {
      label: "Mes biens",
      items: [
        { href: "/client/maisons", label: "Mes maisons", icon: "home" },
        { href: "/client/locataires", label: "Mes locataires", icon: "users" },
      ],
    },
  ];

  return (
    <PortalShell
      groups={groups}
      user={{ name: account.fullName, roleLabel: account.companyName ?? `Client · ${account.reference}` }}
      today={formatToday()}
      brandSubtitle="Espace client"
      logoutHref="/api/auth/logout?to=client"
      fallbackTitle="Espace client"
      notifications={{ count: pending, href: "/client/visites", label: "Demandes de visite à traiter" }}
    >
      {children}
    </PortalShell>
  );
}
