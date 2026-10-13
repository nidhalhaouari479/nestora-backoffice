"use client";

import { type ClipboardEvent, type KeyboardEvent, useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { resendCodeAction, verifyAction, type FormState } from "../actions";

const LENGTH = 6;

function secondsUntil(iso: string | null) {
  return iso ? Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)) : 0;
}

export function VerifyForm({ expiresAt }: { expiresAt: string | null }) {
  const [state, formAction, isPending] = useActionState(verifyAction, undefined);
  const [resendState, setResendState] = useState<FormState>(undefined);
  const [isResending, startResend] = useTransition();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [deadline, setDeadline] = useState(expiresAt);
  const [remaining, setRemaining] = useState(() => secondsUntil(expiresAt));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(secondsUntil(deadline)), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      fill(clean, index);
      return;
    }
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < LENGTH - 1) inputs.current[index + 1]?.focus();
    if (clean && next.every(Boolean)) formRef.current?.requestSubmit();
  }

  function fill(value: string, from = 0) {
    const next = [...digits];
    value.slice(0, LENGTH - from).split("").forEach((digit, offset) => { next[from + offset] = digit; });
    setDigits(next);
    inputs.current[Math.min(from + value.length, LENGTH - 1)]?.focus();
    if (next.every(Boolean)) window.setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    fill(event.clipboardData.getData("text").replace(/\D/g, ""));
  }

  function resend() {
    startResend(async () => {
      const result = await resendCodeAction();
      setResendState(result);
      if (result?.notice) {
        setDigits(Array(LENGTH).fill(""));
        setDeadline(result.expiresAt ?? null);
        inputs.current[0]?.focus();
      }
    });
  }

  const message = state?.error ?? resendState?.error;

  return (
    <form ref={formRef} action={formAction} className="auth-fields">
      <input type="hidden" name="code" value={digits.join("")} />
      <fieldset className="code-inputs">
        <legend className="sr-only">Code de vérification</legend>
        {digits.map((digit, index) => (
          <input key={index} ref={(element) => { inputs.current[index] = element; }} value={digit}
            inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={LENGTH} aria-label={`Chiffre ${index + 1}`}
            autoFocus={index === 0} onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)} onPaste={handlePaste} />
        ))}
      </fieldset>

      <div className="field-row small">
        <span>{remaining > 0 ? `Code valable encore ${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}` : "Code expiré"}</span>
        <button type="button" className="link-button" onClick={resend} disabled={isResending}>Renvoyer le code</button>
      </div>

      {message && <p className="notice notice-error" role="alert">{message}</p>}
      {resendState?.notice && <p className="notice notice-info" role="status">{resendState.notice}</p>}

      <button className="button-primary" type="submit" disabled={isPending || digits.some((digit) => !digit)}>
        {isPending && <Loader2 className="spin" size={16} aria-hidden="true" />}
        Vérifier et ouvrir le portail
      </button>

      <p className="notice notice-teal">Cette connexion sera enregistrée dans le journal d’accès avec l’appareil, l’adresse réseau et le rôle utilisé.</p>

      <Link href="/api/auth/logout" className="back-link" prefetch={false}><ArrowLeft size={13} aria-hidden="true" />Retour à la connexion</Link>
    </form>
  );
}
