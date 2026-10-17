"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FEATURE_KINDS, type Feature, type FeatureKind } from "@/lib/catalog-shared";
import { Checkbox, Field, FormError, SubmitButton, useValues } from "@/components/admin/FormKit";
import { FEATURE_ICONS, FeatureIcon } from "@/components/admin/FeatureIcon";
import { saveFeatureAction } from "./actions";

export function FeatureForm({ feature, kind }: { feature?: Feature; kind: FeatureKind }) {
  const [state, action] = useActionState(saveFeatureAction, undefined);
  const errors = state?.fieldErrors ?? {};
  const v = useValues(state);
  const selectedIcon = v.text("icon", feature?.icon ?? "check");

  return (
    <form action={action} className="panel form-panel" noValidate>
      {feature && <input type="hidden" name="id" value={feature.id} />}
      {feature && <input type="hidden" name="kind" value={feature.kind} />}
      <FormError state={state} />

      <div className="form-grid">
        {!feature && (
          <Field label="Liste *" name="kind" error={errors.kind}>
            <select id="kind" name="kind" defaultValue={v.text("kind", kind)}>
              {FEATURE_KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        )}
        <Field label="Nom *" name="name" error={errors.name}>
          <input id="name" name="name" defaultValue={v.text("name", feature?.name)} placeholder="Machine à laver" required />
        </Field>
        <Field label="Ordre d’affichage" name="sort_order">
          <input id="sort_order" name="sort_order" type="number" min={0} defaultValue={v.text("sort_order", feature?.sort_order ?? 0)} />
        </Field>

        <fieldset className={`form-field wide ${errors.icon ? "has-error" : ""}`}>
          <legend>Icône *</legend>
          <div className="icon-picker">
            {Object.entries(FEATURE_ICONS).map(([key, { label }]) => (
              <label key={key} className="icon-option" title={label}>
                <input type="radio" name="icon" value={key} defaultChecked={selectedIcon === key} />
                <FeatureIcon name={key} size={20} />
                <span className="sr-only">{label}</span>
              </label>
            ))}
          </div>
          {errors.icon && <p className="field-error" role="alert">{errors.icon}</p>}
        </fieldset>
      </div>

      <div className="form-footer">
        <Checkbox name="is_active" label="Visible dans l’application" defaultChecked={v.checked("is_active", feature?.is_active ?? true)} />
        <div className="form-actions">
          <Link href={`/features?kind=${feature?.kind ?? kind}`} className="button-outline">Annuler</Link>
          <SubmitButton>{feature ? "Enregistrer" : "Ajouter"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
