import {
  AlertTriangle, BarChart3, Bell, Building, Calendar, CalendarDays, CalendarRange, Check, Clock3, CreditCard, FileText, House,
  IdCard, KeyRound, LayoutGrid, LayoutTemplate, ListChecks, Megaphone, ScrollText, ShieldCheck, UserCheck, UserCog, Users, KeySquare,
} from "lucide-react";
import type { NavIcon as NavIconName } from "@/lib/auth/permissions";

const ICONS = {
  grid: LayoutGrid,
  "user-check": UserCheck,
  list: ListChecks,
  check: Check,
  "calendar-range": CalendarRange,
  alert: AlertTriangle,
  home: House,
  shield: ShieldCheck,
  calendar: Calendar,
  users: Users,
  "calendar-days": CalendarDays,
  clock: Clock3,
  key: KeySquare,
  file: FileText,
  card: CreditCard,
  "key-round": KeyRound,
  chart: BarChart3,
  layout: LayoutTemplate,
  building: Building,
  bell: Bell,
  megaphone: Megaphone,
  "users-cog": UserCog,
  scroll: ScrollText,
  contact: IdCard,
} satisfies Record<NavIconName, unknown>;

export function NavIcon({ name, size = 19 }: { name: NavIconName; size?: number }) {
  const Icon = ICONS[name];
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
