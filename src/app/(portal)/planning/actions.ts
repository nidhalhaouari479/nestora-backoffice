"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/auth/audit";
import { runCalendarChange, type CalendarActionResult } from "@/lib/calendar-actions";

// Nestora calendar (team availability).
export async function nestoraCalendarAction(formData: FormData): Promise<CalendarActionResult> {
  const staff = await requirePermission("planning.manage", "planning");
  const result = await runCalendarChange(null, formData, staff.userId);
  if (result.ok) {
    await audit("calendar_updated", staff.userId, "planning", { op: String(formData.get("op") ?? "") });
    revalidatePath("/planning");
  }
  return result;
}

// A client's calendar, edited by the team from the client's record.
export async function landlordCalendarAction(landlordId: string, formData: FormData): Promise<CalendarActionResult> {
  const staff = await requirePermission("landlords.manage", "landlords");
  const result = await runCalendarChange(landlordId, formData, staff.userId);
  if (result.ok) {
    await audit("calendar_updated", staff.userId, "landlords", { landlord_id: landlordId, op: String(formData.get("op") ?? "") });
    revalidatePath(`/landlords/${landlordId}/calendar`);
  }
  return result;
}
