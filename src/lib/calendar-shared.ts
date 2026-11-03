// Shared by server code and the Calendar client component (no server imports here).

export const CALENDAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const; // start hours, last slot 18:00 → 19:00

export type CalendarKind = "student_visit" | "client_meeting" | "other" | "blocked" | "open";
export type PaintKind = CalendarKind | "clear";

export const KIND_META: Record<CalendarKind, { label: string; short: string }> = {
  student_visit: { label: "Rendez-vous étudiant", short: "Étudiant" },
  client_meeting: { label: "Rendez-vous client", short: "Client" },
  other: { label: "Autre rendez-vous", short: "Autre" },
  blocked: { label: "Indisponible", short: "Indispo." },
  open: { label: "Libre", short: "Libre" },
};

// Kinds that can be painted by hand. Confirmed visit requests are green automatically;
// a manual green slot covers a visit booked another way (phone, agency…).
export const PAINT_KINDS: { kind: PaintKind; label: string }[] = [
  { kind: "student_visit", label: "Rendez-vous étudiant" },
  { kind: "client_meeting", label: "Rendez-vous client" },
  { kind: "other", label: "Autre rendez-vous" },
  { kind: "blocked", label: "Indisponible" },
  { kind: "open", label: "Ouvert (lève une règle)" },
  { kind: "clear", label: "Effacer" },
];

export const WEEKDAYS = [
  { value: 1, short: "Lun", long: "Lundi" },
  { value: 2, short: "Mar", long: "Mardi" },
  { value: 3, short: "Mer", long: "Mercredi" },
  { value: 4, short: "Jeu", long: "Jeudi" },
  { value: 5, short: "Ven", long: "Vendredi" },
  { value: 6, short: "Sam", long: "Samedi" },
  { value: 0, short: "Dim", long: "Dimanche" },
] as const;

export type CalendarCell = {
  day: string; // YYYY-MM-DD
  hour: number;
  kind: CalendarKind;
  source: "visit" | "entry" | "rule" | "none";
  label: string;
  locked: boolean; // confirmed visit: cannot be repainted
};

export type CalendarRule = { id: string; weekday: number; hour: number | null; kind: CalendarKind };

export type CalendarWeek = {
  start: string; // Monday
  days: string[];
  today: string;
  cells: CalendarCell[];
  rules: CalendarRule[];
};

export function cellKey(day: string, hour: number) {
  return `${day}|${hour}`;
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

// Dates are plain YYYY-MM-DD; arithmetic is done at noon UTC so the day never shifts.
export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

export function mondayOf(iso: string) {
  const weekday = weekdayOf(iso);
  return addDays(iso, weekday === 0 ? -6 : 1 - weekday);
}

export function formatDayHeader(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "short" }).format(date).replace(".", ""),
    day: date.getUTCDate(),
    month: new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "short" }).format(date).replace(".", ""),
  };
}

export function formatWeekRange(start: string) {
  const end = addDays(start, 6);
  const format = (iso: string, withYear: boolean) => new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) })
    .format(new Date(`${iso}T12:00:00Z`));
  return `${format(start, false)} – ${format(end, true)}`;
}
