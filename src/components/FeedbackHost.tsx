"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

// Replaces the browser's alert / confirm / prompt. Mount <FeedbackHost /> once in the root layout,
// then call notify.*, confirmDialog() or promptDialog() from any client component.

type Tone = "success" | "error" | "info" | "warning";
type Toast = { id: number; tone: Tone; message: string; title?: string };
type DialogBase = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; tone?: "danger" | "default" };
type Dialog =
  | (DialogBase & { id: number; kind: "confirm"; resolve: (value: boolean) => void })
  | (DialogBase & { id: number; kind: "prompt"; label?: string; defaultValue?: string; placeholder?: string; resolve: (value: string | null) => void });

let nextId = 1;
let state: { toasts: Toast[]; dialogs: Dialog[] } = { toasts: [], dialogs: [] };
const listeners = new Set<() => void>();
const EMPTY = { toasts: [], dialogs: [] };

function setState(next: typeof state) {
  state = next;
  listeners.forEach((listener) => listener());
}

function dismiss(id: number) {
  setState({ ...state, toasts: state.toasts.filter((toast) => toast.id !== id) });
}

function push(tone: Tone, message: string, title?: string) {
  const id = nextId++;
  setState({ ...state, toasts: [...state.toasts, { id, tone, message, title }].slice(-4) });
  setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4500);
}

export const notify = {
  success: (message: string, title?: string) => push("success", message, title),
  error: (message: string, title?: string) => push("error", message, title),
  info: (message: string, title?: string) => push("info", message, title),
  warning: (message: string, title?: string) => push("warning", message, title),
};

export function confirmDialog(options: DialogBase): Promise<boolean> {
  return new Promise((resolve) => {
    setState({ ...state, dialogs: [...state.dialogs, { ...options, id: nextId++, kind: "confirm", resolve }] });
  });
}

export function promptDialog(options: DialogBase & { label?: string; defaultValue?: string; placeholder?: string }): Promise<string | null> {
  return new Promise((resolve) => {
    setState({ ...state, dialogs: [...state.dialogs, { ...options, id: nextId++, kind: "prompt", resolve }] });
  });
}

function closeDialog(dialog: Dialog, value: boolean | string | null) {
  setState({ ...state, dialogs: state.dialogs.filter((item) => item.id !== dialog.id) });
  if (dialog.kind === "confirm") dialog.resolve(Boolean(value));
  else dialog.resolve(typeof value === "string" ? value : null);
}

const TOAST_ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function FeedbackHost() {
  const { toasts, dialogs } = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  const dialog = dialogs[0];

  return (
    <>
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.tone];
          return (
            <div key={toast.id} className={`toast toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
              <Icon size={18} aria-hidden="true" />
              <div>
                {toast.title && <strong>{toast.title}</strong>}
                <p>{toast.message}</p>
              </div>
              <button type="button" className="toast-close" aria-label="Fermer" onClick={() => dismiss(toast.id)}><X size={16} aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
      {dialog && <DialogBox key={dialog.id} dialog={dialog} />}
    </>
  );
}

function DialogBox({ dialog }: { dialog: Dialog }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(dialog.kind === "prompt" ? dialog.defaultValue ?? "" : "");
  const danger = dialog.tone === "danger";

  useEffect(() => {
    (dialog.kind === "prompt" ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog(dialog, dialog.kind === "prompt" ? null : false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const confirm = () => closeDialog(dialog, dialog.kind === "prompt" ? value : true);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(dialog, dialog.kind === "prompt" ? null : false); }}>
      <form
        className="modal modal-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`dialog-${dialog.id}-title`}
        aria-describedby={dialog.message ? `dialog-${dialog.id}-message` : undefined}
        onSubmit={(event) => { event.preventDefault(); confirm(); }}
      >
        <div className="modal-body dialog-body">
          <span className={`dialog-icon ${danger ? "dialog-icon-danger" : ""}`} aria-hidden="true">
            {danger ? <AlertTriangle size={20} /> : <Info size={20} />}
          </span>
          <div>
            <h2 id={`dialog-${dialog.id}-title`} className="dialog-title">{dialog.title}</h2>
            {dialog.message && <p id={`dialog-${dialog.id}-message`} className="dialog-message">{dialog.message}</p>}
            {dialog.kind === "prompt" && (
              <div className="form-field dialog-field">
                {dialog.label && <label htmlFor={`dialog-${dialog.id}-input`}>{dialog.label}</label>}
                <input id={`dialog-${dialog.id}-input`} ref={inputRef} value={value} placeholder={dialog.placeholder} onChange={(event) => setValue(event.target.value)} />
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="button-outline" onClick={() => closeDialog(dialog, dialog.kind === "prompt" ? null : false)}>{dialog.cancelLabel ?? "Annuler"}</button>
          <button type="submit" ref={confirmRef} className={danger ? "button-danger-solid" : "button-dark"}>{dialog.confirmLabel ?? "Confirmer"}</button>
        </div>
      </form>
    </div>
  );
}
