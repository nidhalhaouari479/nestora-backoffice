import { addRules, deleteRule, paintCells, parseCells } from "@/lib/calendar";
import type { CalendarKind, PaintKind } from "@/lib/calendar-shared";

export type CalendarActionResult = { ok: true; message: string } | { ok: false; error: string };

// Runs one calendar change from the Calendar component's form data. The caller has already
// checked who may edit which calendar (landlordId null = Nestora).
// Client portal: the client only marks or clears "Indisponible". Visits turn green on their own.
export const CLIENT_CALENDAR_PERMISSIONS = { paintKinds: ["blocked", "clear"] as PaintKind[], editableKinds: ["blocked"] as CalendarKind[] };

type Limits = { paintKinds: PaintKind[]; editableKinds: CalendarKind[] };

export async function runCalendarChange(landlordId: string | null, formData: FormData, userId: string, limits?: Limits): Promise<CalendarActionResult> {
  const op = String(formData.get("op") ?? "");
  try {
    if (op === "paint") {
      const cells = parseCells(String(formData.get("cells") ?? ""));
      const kind = String(formData.get("kind") ?? "") as PaintKind;
      if (cells.length === 0) return { ok: false, error: "Sélectionne au moins un créneau." };
      if (limits && !limits.paintKinds.includes(kind)) return { ok: false, error: "Tu peux seulement marquer des créneaux comme indisponibles." };
      const changed = await paintCells(landlordId, cells, kind, String(formData.get("label") ?? "").trim(), userId, limits?.editableKinds);
      if (changed === 0) return { ok: false, error: "Ces créneaux sont gérés par l’équipe Nestora et ne peuvent pas être modifiés." };
      return { ok: true, message: `${changed} créneau${changed > 1 ? "x" : ""} mis à jour.` };
    }
    if (op === "rule") {
      const weekdays = formData.getAll("weekday").map(Number);
      const hours = formData.get("allDay") === "on" ? [null] : formData.getAll("hour").map(Number);
      const kind = String(formData.get("kind") ?? "") as CalendarKind | "clear";
      if (limits && !limits.paintKinds.includes(kind)) return { ok: false, error: "Tu peux seulement marquer des créneaux comme indisponibles." };
      await addRules(landlordId, weekdays, hours, kind, userId);
      return { ok: true, message: kind === "clear" ? "Règle retirée." : "Règle hebdomadaire enregistrée." };
    }
    if (op === "delete-rule") {
      await deleteRule(landlordId, String(formData.get("ruleId") ?? ""), limits?.editableKinds);
      return { ok: true, message: "Règle supprimée." };
    }
    return { ok: false, error: "Action inconnue." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossible d’enregistrer. Réessaie." };
  }
}
