// Shared by Server Actions and client forms.
export type FormValues = Record<string, string | string[]>;
export type ActionState = { error?: string; fieldErrors?: Record<string, string>; values?: FormValues } | undefined;

// Submitted values, returned on error so the form is not emptied (React resets forms after an action).
export function formValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key).filter((value): value is string => typeof value === "string");
    values[key] = all.length > 1 ? all : all[0] ?? "";
  }
  return values;
}
