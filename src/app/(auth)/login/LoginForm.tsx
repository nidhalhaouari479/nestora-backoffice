"use client";

import { useActionState, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { loginAction } from "../actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialError ? { error: initialError } : undefined);
  const [showReset, setShowReset] = useState(false);

  return (
    <form action={formAction} className="auth-fields" noValidate={false}>
      <label className="field">
        <span>Adresse e-mail</span>
        <input name="email" type="email" autoComplete="username" placeholder="admin@nestora.tn" required autoFocus />
      </label>
      <label className="field">
        <span>Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" placeholder="••••••••••••" required />
      </label>
      <div className="field-row">
        <label className="checkbox">
          <input type="checkbox" name="remember" />
          Rester connecté sur cet appareil
        </label>
        <button type="button" className="link-button" onClick={() => setShowReset((value) => !value)}>Mot de passe oublié ?</button>
      </div>

      {showReset && <p className="notice notice-info" role="status">Pour des raisons de sécurité, les mots de passe de l’équipe sont réinitialisés par un administrateur. Contacte ton responsable.</p>}
      {state?.error && <p className="notice notice-error" role="alert">{state.error}</p>}

      <button className="button-primary" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="spin" size={16} aria-hidden="true" />}
        Se connecter en toute sécurité
      </button>

      <p className="notice notice-teal">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>Authentification renforcée, journalisation des connexions et permissions par rôle. Les paiements, contrats et documents sensibles nécessitent une autorisation dédiée.</span>
      </p>
    </form>
  );
}
