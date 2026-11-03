import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  CALENDAR_HOURS, addDays, cellKey, mondayOf, weekdayOf,
  type CalendarCell, type CalendarKind, type CalendarRule, type CalendarWeek, type PaintKind,
} from "@/lib/calendar-shared";

// Availability calendars (8:00 → 19:00, one-hour slots). landlordId = null → the Nestora calendar.
// Callers check permissions first (requirePermission / requireLandlord): this module uses the
// service role, the tables have no RLS policy. Precedence mirrors calendar_cell_kind() in SQL.

type EntryRow = { day: string; hour: number; kind: CalendarKind; label: string };
type RuleRow = { id: string; weekday: number; hour: number | null; kind: CalendarKind };
type VisitRow = {
  id: string; student_id: string; confirmed_date: string; slot_start: string; slot_end: string;
  listings: { title: string; landlord_id: string | null } | null;
};

export function todayInTunis() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function parseWeekStart(value: string | string[] | undefined) {
  const raw = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayInTunis();
  return mondayOf(raw);
}

function scoped<T extends { is: (column: string, value: null) => T; eq: (column: string, value: string) => T }>(query: T, landlordId: string | null) {
  return landlordId ? query.eq("landlord_id", landlordId) : query.is("landlord_id", null);
}

function hourOf(time: string) {
  return Number(time.slice(0, 2));
}

export async function getCalendarWeek(landlordId: string | null, weekStart: string, options: { showStudentNames: boolean }): Promise<CalendarWeek> {
  const admin = getSupabaseAdmin();
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const end = days[6];

  const [entriesResult, rulesResult, visitsResult] = await Promise.all([
    scoped(admin.from("calendar_entries").select("day, hour, kind, label"), landlordId).gte("day", weekStart).lte("day", end),
    scoped(admin.from("calendar_rules").select("id, weekday, hour, kind"), landlordId).order("weekday").order("hour", { nullsFirst: true }),
    admin.from("visit_requests")
      .select("id, student_id, confirmed_date, slot_start, slot_end, listings!inner(title, landlord_id)")
      .eq("status", "confirmed").gte("confirmed_date", weekStart).lte("confirmed_date", end),
  ]);
  if (entriesResult.error) throw new Error(`calendar_entries: ${entriesResult.error.message}`);
  if (rulesResult.error) throw new Error(`calendar_rules: ${rulesResult.error.message}`);
  if (visitsResult.error) throw new Error(`visit_requests: ${visitsResult.error.message}`);

  const entries = new Map((entriesResult.data as EntryRow[]).map((row) => [cellKey(row.day, row.hour), row]));
  const rules = rulesResult.data as RuleRow[];
  const visits = (visitsResult.data as unknown as VisitRow[]).filter((visit) => !landlordId || visit.listings?.landlord_id === landlordId);

  const names = new Map<string, string>();
  if (options.showStudentNames && visits.length > 0) {
    const { data } = await admin.from("student_profiles").select("user_id, first_name, last_name").in("user_id", [...new Set(visits.map((visit) => visit.student_id))]);
    for (const row of (data ?? []) as { user_id: string; first_name: string; last_name: string }[]) names.set(row.user_id, `${row.first_name} ${row.last_name}`.trim());
  }

  const visitCells = new Map<string, string>();
  for (const visit of visits) {
    const last = Math.max(hourOf(visit.slot_start), Math.ceil((hourOf(visit.slot_end) * 60 + Number(visit.slot_end.slice(3, 5))) / 60) - 1);
    for (let hour = hourOf(visit.slot_start); hour <= last; hour += 1) {
      const who = names.get(visit.student_id);
      visitCells.set(cellKey(visit.confirmed_date, hour), `Visite${who ? ` · ${who}` : ""} · ${visit.listings?.title ?? "Logement"}`);
    }
  }

  const cells: CalendarCell[] = [];
  for (const day of days) {
    const weekday = weekdayOf(day);
    for (const hour of CALENDAR_HOURS) {
      const key = cellKey(day, hour);
      const visit = visitCells.get(key);
      const entry = entries.get(key);
      const rule = rules.find((item) => item.weekday === weekday && item.hour === hour) ?? rules.find((item) => item.weekday === weekday && item.hour === null);
      if (visit) cells.push({ day, hour, kind: "student_visit", source: "visit", label: visit, locked: true });
      else if (entry) cells.push({ day, hour, kind: entry.kind, source: "entry", label: entry.label, locked: false });
      else if (rule) cells.push({ day, hour, kind: rule.kind, source: "rule", label: "Règle hebdomadaire", locked: false });
      else cells.push({ day, hour, kind: "open", source: "none", label: "", locked: false });
    }
  }

  return { start: weekStart, days, today: todayInTunis(), cells, rules: rules as CalendarRule[] };
}

const VALID_HOURS = new Set<number>(CALENDAR_HOURS);
const PAINTABLE = new Set<PaintKind>(["student_visit", "client_meeting", "other", "blocked", "open", "clear"]);

export function parseCells(raw: string) {
  const cells: { day: string; hour: number }[] = [];
  for (const key of raw.split(",").slice(0, 500)) {
    const [day, hourText] = key.split("|");
    const hour = Number(hourText);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day ?? "") && VALID_HOURS.has(hour)) cells.push({ day, hour });
  }
  return cells;
}

// `editableKinds`: when set (client portal), only cells that are empty or already hold one of
// these kinds are changed; the team's appointments on the client's calendar stay untouched.
export async function paintCells(landlordId: string | null, cells: { day: string; hour: number }[], kind: PaintKind, label: string, userId: string, editableKinds?: CalendarKind[]) {
  if (!PAINTABLE.has(kind)) throw new Error("Type de créneau inconnu.");
  if (cells.length === 0) return 0;
  const admin = getSupabaseAdmin();

  if (editableKinds) {
    const days = [...new Set(cells.map((cell) => cell.day))];
    const { data, error } = await scoped(admin.from("calendar_entries").select("day, hour, kind"), landlordId).in("day", days);
    if (error) throw new Error(error.message);
    const locked = new Set((data as EntryRow[]).filter((row) => !editableKinds.includes(row.kind)).map((row) => cellKey(row.day, row.hour)));
    cells = cells.filter((cell) => !locked.has(cellKey(cell.day, cell.hour)));
    if (cells.length === 0) return 0;
  }

  if (kind === "clear") {
    for (const day of new Set(cells.map((cell) => cell.day))) {
      const hours = cells.filter((cell) => cell.day === day).map((cell) => cell.hour);
      let query = scoped(admin.from("calendar_entries").delete(), landlordId).eq("day", day).in("hour", hours);
      if (editableKinds) query = query.in("kind", editableKinds);
      const { error } = await query;
      if (error) throw new Error(error.message);
    }
    return cells.length;
  }

  const rows = cells.map((cell) => ({ landlord_id: landlordId, day: cell.day, hour: cell.hour, kind, label: label.slice(0, 120), created_by: userId }));
  const { error } = await admin.from("calendar_entries").upsert(rows as never, { onConflict: "landlord_id,day,hour" });
  if (error) throw new Error(error.message);
  return cells.length;
}

export async function addRules(landlordId: string | null, weekdays: number[], hours: (number | null)[], kind: CalendarKind | "clear", userId: string) {
  const admin = getSupabaseAdmin();
  const validDays = weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const validHours = hours.filter((hour) => hour === null || VALID_HOURS.has(hour));
  if (validDays.length === 0 || validHours.length === 0) throw new Error("Choisis au moins un jour et une plage horaire.");

  if (kind === "clear") {
    for (const weekday of validDays) {
      for (const hour of validHours) {
        const query = scoped(admin.from("calendar_rules").delete(), landlordId).eq("weekday", String(weekday));
        const { error } = await (hour === null ? query.is("hour", null) : query.eq("hour", String(hour)));
        if (error) throw new Error(error.message);
      }
    }
    return;
  }
  if (kind === "student_visit") throw new Error("Une règle hebdomadaire ne peut pas être un rendez-vous étudiant.");

  const rows = validDays.flatMap((weekday) => validHours.map((hour) => ({ landlord_id: landlordId, weekday, hour, kind, created_by: userId })));
  const { error } = await admin.from("calendar_rules").upsert(rows as never, { onConflict: "landlord_id,weekday,hour" });
  if (error) throw new Error(error.message);
}

export async function deleteRule(landlordId: string | null, ruleId: string, editableKinds?: CalendarKind[]) {
  let query = scoped(getSupabaseAdmin().from("calendar_rules").delete(), landlordId).eq("id", ruleId);
  if (editableKinds) query = query.in("kind", editableKinds);
  const { error } = await query;
  if (error) throw new Error(error.message);
}
