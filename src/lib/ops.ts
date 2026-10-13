import { createSupabaseServerClient } from "@/lib/supabase/server";

export const TIME_ZONE = "Africa/Tunis";

export type Tone = "warning" | "info" | "success" | "danger" | "neutral";

export type OpsTask = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  status_label: string;
  tone: Tone;
  action_label: string;
  initials: string;
  due_at: string | null;
};

export type ScheduleEvent = { id: string; starts_at: string; title: string; detail: string; tone: Tone };

export type CommandCenterStats = {
  published_listings: number;
  published_this_week: number;
  available_places: number;
  availability_fresh_pct: number;
  active_cases: number;
  cases_need_action: number;
  cases_complete_pct: number;
  visits_today: number;
  visits_to_confirm: number;
  holds_under_3h: number;
  holds_at_risk: number;
  payments_to_verify: number;
  oldest_payment_minutes: number;
  payments_reconciled_pct: number;
  sla_pct: number;
  open_tasks: number;
};

export type WorkspaceStats = {
  open_tasks: number;
  due_before_13: number;
  approvals: number;
  sensitive_payments: number;
  planning_today: number;
  next_event_at: string | null;
  at_risk: number;
  oldest_at_risk_minutes: number;
  in_time_pct: number;
  median_minutes: number;
  reopened: number;
};

const TASK_COLUMNS = "id, kind, title, detail, status_label, tone, action_label, initials, due_at";

// Minutes between Tunis wall-clock time and UTC at a given instant.
function tunisOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)!.value);
  const wallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((wallClockAsUtc - date.getTime()) / 60_000);
}

// Start and end of "today" in Tunis, as ISO strings.
function todayRange() {
  const now = new Date();
  const offset = tunisOffsetMinutes(now);
  const local = new Date(now.getTime() + offset * 60_000);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset * 60_000;
  return { from: new Date(start).toISOString(), to: new Date(start + 86_400_000).toISOString() };
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatToday() {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

// Data is read with the staff member's own session, so RLS (is_verified_staff) applies.
export async function getCommandCenter() {
  const supabase = await createSupabaseServerClient();
  const { from, to } = todayRange();
  const [stats, tasks, events] = await Promise.all([
    supabase.rpc("ops_command_center_stats"),
    supabase.from("ops_tasks").select(TASK_COLUMNS).is("completed_at", null).order("priority", { ascending: false }).limit(5),
    supabase.from("ops_schedule_events").select("id, starts_at, title, detail, tone").gte("starts_at", from).lt("starts_at", to).order("starts_at").limit(6),
  ]);
  if (stats.error) throw new Error(`ops_command_center_stats: ${stats.error.message}`);
  return {
    stats: stats.data as CommandCenterStats,
    tasks: (tasks.data ?? []) as OpsTask[],
    events: (events.data ?? []) as ScheduleEvent[],
  };
}

export async function getWorkspace(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { from, to } = todayRange();
  const [stats, tasks, events] = await Promise.all([
    supabase.rpc("ops_workspace_stats"),
    supabase.from("ops_tasks").select(TASK_COLUMNS).eq("assignee_id", userId).is("completed_at", null).order("priority", { ascending: false }).limit(6),
    supabase.from("ops_schedule_events").select("id, starts_at, title, detail, tone").eq("assignee_id", userId).gte("starts_at", from).lt("starts_at", to).order("starts_at").limit(6),
  ]);
  if (stats.error) throw new Error(`ops_workspace_stats: ${stats.error.message}`);
  return {
    stats: stats.data as WorkspaceStats,
    tasks: (tasks.data ?? []) as OpsTask[],
    events: (events.data ?? []) as ScheduleEvent[],
  };
}

export async function getNavCounts(permissions: string[]) {
  if (!permissions.includes("command_center.view")) return { open_tasks: null, payments_to_verify: null, urgent: 0 };
  const supabase = await createSupabaseServerClient();
  const [{ data }, urgent] = await Promise.all([
    supabase.rpc("ops_command_center_stats"),
    supabase.from("ops_tasks").select("id", { count: "exact", head: true }).is("completed_at", null).lt("due_at", new Date(Date.now() + 3_600_000).toISOString()),
  ]);
  const stats = data as CommandCenterStats | null;
  return {
    open_tasks: stats?.open_tasks ?? null,
    payments_to_verify: permissions.includes("payments.view") ? stats?.payments_to_verify ?? null : null,
    urgent: urgent.count ?? 0,
  };
}
