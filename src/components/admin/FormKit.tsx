"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import type { ActionState } from "@/lib/forms";

export type { ActionState };

// Reads a value: submitted value first (after an error), otherwise the saved record.
export function useValues(state: ActionState) {
  const submitted = state?.values;
  return {
    text: (key: string, fallback?: string | number | null) => {
      const value = submitted?.[key];
      return submitted ? (Array.isArray(value) ? value[0] : value) ?? "" : fallback == null ? "" : String(fallback);
    },
    checked: (key: string, fallback?: boolean) => (submitted ? submitted[key] !== undefined : Boolean(fallback)),
    list: (key: string, fallback: string[] = []) => {
      if (!submitted) return fallback;
      const value = submitted[key];
      return value === undefined ? [] : Array.isArray(value) ? value : [value];
    },
  };
}

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button-dark" disabled={pending}>
      {pending && <Loader2 className="spin" size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({ label, name, error, hint, children, wide = false }: { label: string; name?: string; error?: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`form-field ${wide ? "wide" : ""} ${error ? "has-error" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked, value = "on" }: { name: string; label: string; defaultChecked?: boolean; value?: string }) {
  return (
    <label className="check-chip">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

// Error banner; scrolls back to it so long forms show what to fix.
export function FormError({ state }: { state: ActionState }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state?.error) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);
  if (!state?.error) return null;
  return <p ref={ref} className="notice notice-error form-banner" role="alert">{state.error}</p>;
}
