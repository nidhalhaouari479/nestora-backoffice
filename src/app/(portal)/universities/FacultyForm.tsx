"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Faculty } from "@/lib/catalog-shared";
import { Checkbox, Field, FormError, SubmitButton, useValues } from "@/components/admin/FormKit";
import { saveFacultyAction } from "./actions";

export function FacultyForm({ faculty }: { faculty?: Faculty }) {
  const [state, action] = useActionState(saveFacultyAction, undefined);
  const errors = state?.fieldErrors ?? {};
  const v = useValues(state);

  return (
    <form action={action} className="panel form-panel" noValidate>
      {faculty && <input type="hidden" name="id" value={faculty.id} />}
      <input type="hidden" name="image_url" value={faculty?.image_url ?? ""} />
      <FormError state={state} />

      <h3 className="form-section-title">Faculté</h3>
      <div className="form-grid">
        <Field label="Nom complet *" name="name" error={errors.name} wide>
          <input id="name" name="name" defaultValue={v.text("name", faculty?.name)} placeholder="Faculté des Sciences de Tunis" required />
        </Field>
        <Field label="Nom court *" name="short_name" error={errors.short_name} hint="Affiché aux étudiants : « près de FST »">
          <input id="short_name" name="short_name" defaultValue={v.text("short_name", faculty?.short_name)} placeholder="FST" required />
        </Field>
        <Field label="Ville" name="city">
          <input id="city" name="city" defaultValue={v.text("city", faculty?.city ?? "Tunis")} />
        </Field>
      </div>

      <h3 className="form-section-title">Photo</h3>
      <div className="form-grid">
        {faculty?.image_url && (
          <div className="form-field">
            <span className="field-label-text">Photo actuelle</span>
            <span className="thumb large" style={{ backgroundImage: `url('${faculty.image_url}')`, backgroundPosition: faculty.image_position }} role="img" aria-label={faculty.name} />
          </div>
        )}
        <Field label={faculty?.image_url ? "Remplacer la photo" : "Photo"} name="image" error={errors.image} hint="JPG, PNG ou WebP, 3 Mo maximum">
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </Field>
        <Field label="Ordre d’affichage" name="sort_order">
          <input id="sort_order" name="sort_order" type="number" min={0} defaultValue={v.text("sort_order", faculty?.sort_order ?? 0)} />
        </Field>
      </div>

      <div className="form-footer">
        <Checkbox name="is_active" label="Visible dans l’application" defaultChecked={v.checked("is_active", faculty?.is_active ?? true)} />
        <div className="form-actions">
          <Link href="/universities" className="button-outline">Annuler</Link>
          <SubmitButton>{faculty ? "Enregistrer" : "Ajouter la faculté"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
