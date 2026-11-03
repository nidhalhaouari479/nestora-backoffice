"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { clientLoginAction } from "../../actions";

export function ClientLoginForm() {
  const [state, formAction, isPending] = useActionState(clientLoginAction, undefined);
  return (
    <form action={formAction} className="auth-fields">
      <label className="field">
        <span>Adresse e-mail</span>
        <input name="email" type="email" autoComplete="username" placeholder="toi@exemple.tn" required autoFocus />
      </label>
      <label className="field">
        <span>Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </label>
      {state?.error && <p className="notice notice-error" role="alert">{state.error}</p>}
      <button className="button-primary" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="spin" size={16} aria-hidden="true" />}
        Se connecter
      </button>
    </form>
  );
}
