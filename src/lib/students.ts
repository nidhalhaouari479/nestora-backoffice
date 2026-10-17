import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TIME_ZONE, type Tone } from "@/lib/ops";

// Students who signed up on the website. Read through staff_list_students / staff_get_student,
// which check the students.view permission and add auth data (last sign-in) and activity.

export type StudentGender = "female" | "male";

export const STUDENT_GENDERS: { value: StudentGender; label: string }[] = [
  { value: "female", label: "Fille" },
  { value: "male", label: "Garçon" },
];

export function genderLabel(value: string | null) {
  return STUDENT_GENDERS.find((gender) => gender.value === value)?.label ?? "—";
}

export type StudentRow = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_country_code: string;
  phone_number: string | null;
  gender: StudentGender | null;
  university_id: string | null;
  university_name: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  favorites_count: number;
  visits_count: number;
  holds_count: number;
  cases_count: number;
};

export type StudentDetail = {
  profile: Omit<StudentRow, "favorites_count" | "visits_count" | "holds_count" | "cases_count"> & {
    preferred_channel: string;
    updated_at: string;
    email_confirmed_at: string | null;
    auth_created_at: string | null;
  };
  favorites: { listing_id: string; title: string; neighborhood: string; price_tnd: number; status: string; created_at: string }[];
  visits: { id: string; reference: string; listing_id: string; title: string; status: string; preferred_dates: string[]; slot_start: string; slot_end: string; confirmed_date: string | null; created_at: string }[];
  holds: { id: string; listing_id: string; title: string; status: string; expires_at: string; created_at: string }[];
  cases: { id: string; reference: string; listing_id: string | null; title: string | null; status: string; needs_action: boolean; is_complete: boolean; created_at: string }[];
};

export const VISIT_STATUSES: Record<string, { label: string; tone: Tone }> = {
  requested: { label: "Demandée", tone: "warning" },
  slot_confirmation: { label: "Créneau à confirmer", tone: "warning" },
  confirmed: { label: "Confirmée", tone: "info" },
  completed: { label: "Effectuée", tone: "success" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export const HOLD_STATUSES: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "warning" },
  converted: { label: "Convertie", tone: "success" },
  released: { label: "Libérée", tone: "neutral" },
  expired: { label: "Expirée", tone: "neutral" },
};

export const CASE_STATUSES: Record<string, { label: string; tone: Tone }> = {
  open: { label: "Ouvert", tone: "info" },
  payment_review: { label: "Paiement à vérifier", tone: "warning" },
  contract: { label: "Contrat", tone: "info" },
  move_in: { label: "Emménagement", tone: "info" },
  closed: { label: "Clôturé", tone: "success" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

export function studentName(student: { first_name: string; last_name: string }) {
  return `${student.first_name} ${student.last_name}`.trim() || "Sans nom";
}

export function studentPhone(student: { phone_country_code: string; phone_number: string | null }) {
  return student.phone_number ? `${student.phone_country_code} ${student.phone_number}` : "—";
}

export function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function countSignedUpThisWeek(students: StudentRow[]) {
  const weekAgo = Date.now() - 7 * 86_400_000;
  return students.filter((student) => new Date(student.created_at).getTime() > weekAgo).length;
}

export async function listStudents({ q = "", gender = "", university = "", verified = "" } = {}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("staff_list_students", { p_search: q, p_gender: gender, p_university: university, p_verified: verified } as never);
  if (error) throw new Error(`staff_list_students: ${error.message}`);
  return (data ?? []) as StudentRow[];
}

export async function getStudent(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("staff_get_student", { p_id: id } as never);
  if (error) throw new Error(`staff_get_student: ${error.message}`);
  return data as StudentDetail | null;
}
