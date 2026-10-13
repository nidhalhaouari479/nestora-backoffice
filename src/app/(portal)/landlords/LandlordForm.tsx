"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Landlord } from "@/lib/catalog-shared";
import { Checkbox, Field, FormError, SubmitButton, useValues } from "@/components/admin/FormKit";
import { saveLandlordAction } from "./actions";

export function LandlordForm({ landlord }: { landlord?: Landlord }) {
  const [state, action] = useActionState(saveLandlordAction, undefined);
  const errors = state?.fieldErrors ?? {};
  const v = useValues(state);

  return (
    <form action={action} className="panel form-panel" noValidate>
      {landlord && <input type="hidden" name="id" value={landlord.id} />}
      <FormError state={state} />

      <h3 className="form-section-title">Identité</h3>
      <div className="form-grid">
        <Field label="Nom complet *" name="full_name" error={errors.full_name}>
          <input id="full_name" name="full_name" defaultValue={v.text("full_name", landlord?.full_name)} placeholder="Karim Ben Ali" required />
        </Field>
        <Field label="Société (optionnel)" name="company_name">
          <input id="company_name" name="company_name" defaultValue={v.text("company_name", landlord?.company_name)} placeholder="Agence, résidence…" />
        </Field>
        <Field label="CIN / identifiant (optionnel)" name="national_id">
          <input id="national_id" name="national_id" defaultValue={v.text("national_id", landlord?.national_id)} placeholder="08123456" />
        </Field>
      </div>

      <h3 className="form-section-title">Contact</h3>
      <div className="form-grid">
        <Field label="Téléphone *" name="phone" error={errors.phone}>
          <input id="phone" name="phone" type="tel" defaultValue={v.text("phone", landlord?.phone)} placeholder="+216 22 111 222" required />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <input id="email" name="email" type="email" defaultValue={v.text("email", landlord?.email)} placeholder="karim@email.com" />
        </Field>
        <Field label="Adresse" name="address" wide>
          <input id="address" name="address" defaultValue={v.text("address", landlord?.address)} placeholder="Rue, quartier, ville" />
        </Field>
        <Field label="Notes internes" name="notes" wide>
          <textarea id="notes" name="notes" rows={3} defaultValue={v.text("notes", landlord?.notes)} placeholder="Disponibilités, préférences de contact…" />
        </Field>
      </div>

      <div className="form-footer">
        <Checkbox name="is_active" label="Client actif" defaultChecked={v.checked("is_active", landlord?.is_active ?? true)} />
        <div className="form-actions">
          <Link href="/landlords" className="button-outline">Annuler</Link>
          <SubmitButton>{landlord ? "Enregistrer" : "Créer le client"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
