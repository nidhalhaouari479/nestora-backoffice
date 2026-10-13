import { requireStaff } from "@/lib/auth/session";
import { formatToday, getNavCounts } from "@/lib/ops";
import { publicEnv } from "@/lib/env";
import { Sidebar } from "@/components/portal/Sidebar";
import { IdleWatcher } from "@/components/portal/IdleWatcher";
import { Topbar } from "@/components/portal/Topbar";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const staff = await requireStaff();
  const counts = await getNavCounts(staff.permissions);

  return (
    <div className="portal">
      <Sidebar permissions={staff.permissions} counts={counts} user={{ name: staff.fullName, roleLabel: staff.roleLabel }} />
      <div className="portal-main">
        <Topbar today={formatToday()} notifications={counts.urgent} />
        {children}
      </div>
      <IdleWatcher idleMinutes={publicEnv.idleMinutes} />
    </div>
  );
}
