"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { LISTING_STATUSES, LISTING_TYPES, type Faculty, type Landlord, type ListingDetail } from "@/lib/catalog-shared";
import { Checkbox, Field, FormError, SubmitButton, useValues } from "@/components/admin/FormKit";
import { saveListingAction } from "./actions";

type Props = {
  listing?: ListingDetail;
  landlords: Pick<Landlord, "id" | "full_name" | "reference" | "phone" | "is_active">[];
  faculties: Pick<Faculty, "id" | "name" | "short_name" | "is_active">[];
};

const AMENITIES = [
  ["is_furnished", "Meublé"], ["has_wifi", "Wi-Fi"], ["has_ac", "Climatiseur"],
  ["has_heating", "Chauffage"], ["in_residence", "Résidence"], ["has_desk", "Bureau"],
] as const;

const TRUST = [
  ["verified_onsite", "Visité sur place"], ["address_verified", "Adresse vérifiée"],
  ["photos_verified", "Photos vérifiées"], ["landlord_verified", "Bailleur vérifié"],
] as const;

const COLLECTIONS = [["near_campus", "À deux pas du campus"], ["september", "Disponibles en septembre"], ["foyer", "Foyers privés vérifiés"]] as const;
const NEARBY = [["university", "Université"], ["transport", "Transport"], ["cafe", "Café"], ["supermarket", "Supermarché"]] as const;

export function ListingForm({ listing, landlords, faculties }: Props) {
  const [state, action] = useActionState(saveListingAction, undefined);
  const errors = state?.fieldErrors ?? {};
  const v = useValues(state);
  const [facultyQuery, setFacultyQuery] = useState("");
  const [photos, setPhotos] = useState(() => [...(listing?.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((photo) => photo.url));

  const selectedFaculties = v.list("faculties", listing?.listing_universities.map((link) => link.university_id) ?? []);
  const nearby = Object.fromEntries((listing?.listing_nearby ?? []).map((item) => [item.kind, item.minutes]));
  const visibleFaculties = useMemo(() => {
    const term = facultyQuery.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    return faculties.filter((faculty) => !term || `${faculty.short_name ?? ""} ${faculty.name}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(term));
  }, [faculties, facultyQuery]);
  const activeLandlords = landlords.filter((landlord) => landlord.is_active || landlord.id === listing?.landlord_id);

  return (
    <form action={action} className="panel form-panel" noValidate>
      {listing && <input type="hidden" name="id" value={listing.id} />}
      <FormError state={state} />

      <h3 className="form-section-title">Client et facultés</h3>
      <div className="form-grid">
        <Field label="Client propriétaire *" name="landlord_id" error={errors.landlord_id}>
          <select id="landlord_id" name="landlord_id" defaultValue={v.text("landlord_id", listing?.landlord_id)} required>
            <option value="">Choisir un client…</option>
            {activeLandlords.map((landlord) => (
              <option key={landlord.id} value={landlord.id}>{landlord.full_name} · {landlord.phone} ({landlord.reference})</option>
            ))}
          </select>
        </Field>
        <div className="form-field inline-link">
          <Link href="/landlords/new" className="table-link" target="_blank"><Plus size={14} aria-hidden="true" />Nouveau client</Link>
        </div>

        <fieldset className={`form-field wide faculty-picker ${errors.faculties ? "has-error" : ""}`}>
          <legend>Facultés liées * <small>(au moins une)</small></legend>
          <label className="filter-search small">
            <Search size={14} aria-hidden="true" />
            <span className="sr-only">Filtrer les facultés</span>
            <input value={facultyQuery} onChange={(event) => setFacultyQuery(event.target.value)} placeholder="Filtrer les facultés" />
          </label>
          <div className="check-grid">
            {faculties.map((faculty) => (
              <label key={faculty.id} className="check-chip" hidden={!visibleFaculties.includes(faculty)}>
                <input type="checkbox" name="faculties" value={faculty.id} defaultChecked={selectedFaculties.includes(faculty.id)} />
                <span><strong>{faculty.short_name ?? faculty.name}</strong>{!faculty.is_active && " (masquée)"}</span>
              </label>
            ))}
          </div>
          {faculties.length === 0 && <p className="field-hint">Aucune faculté : <Link href="/universities/new" className="table-link">ajoute-en une</Link>.</p>}
          {errors.faculties && <p className="field-error" role="alert">{errors.faculties}</p>}
        </fieldset>
      </div>

      <h3 className="form-section-title">Description</h3>
      <div className="form-grid">
        <Field label="Titre *" name="title" error={errors.title} wide>
          <input id="title" name="title" defaultValue={v.text("title", listing?.title)} placeholder="Studio lumineux à El Manar 2" required />
        </Field>
        <Field label="Type *" name="listing_type" error={errors.listing_type}>
          <select id="listing_type" name="listing_type" defaultValue={v.text("listing_type", listing?.listing_type ?? "s0")}>
            {LISTING_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </Field>
        <Field label="Statut" name="status" error={errors.status} hint="Seules les maisons publiées sont visibles par les étudiants">
          <select id="status" name="status" defaultValue={v.text("status", listing?.status ?? "draft")}>
            {LISTING_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </Field>
        <Field label="Titre court (cartes)" name="short_title">
          <input id="short_title" name="short_title" defaultValue={v.text("short_title", listing?.short_title)} placeholder="Studio lumineux · El Manar 2" />
        </Field>
        <Field label="Accroche (page détail)" name="headline">
          <input id="headline" name="headline" defaultValue={v.text("headline", listing?.headline)} placeholder="Studio lumineux à deux pas du campus." />
        </Field>
        <Field label="Phrase courte" name="tagline" wide>
          <input id="tagline" name="tagline" defaultValue={v.text("tagline", listing?.tagline)} placeholder="Un coin calme et lumineux pour étudier après les cours." />
        </Field>
        <Field label="Description" name="description" wide>
          <textarea id="description" name="description" rows={3} defaultValue={v.text("description", listing?.description)} />
        </Field>
      </div>

      <h3 className="form-section-title">Adresse</h3>
      <div className="form-grid">
        <Field label="Quartier *" name="neighborhood" error={errors.neighborhood}>
          <input id="neighborhood" name="neighborhood" defaultValue={v.text("neighborhood", listing?.neighborhood)} placeholder="El Manar 2" required />
        </Field>
        <Field label="Ville" name="city">
          <input id="city" name="city" defaultValue={v.text("city", listing?.city ?? "Tunis")} />
        </Field>
        <Field label="Lien Google Maps" name="maps_url" wide>
          <input id="maps_url" name="maps_url" type="url" defaultValue={v.text("maps_url", listing?.maps_url)} placeholder="https://maps.google.com/…" />
        </Field>
      </div>

      <h3 className="form-section-title">Prix, capacité et disponibilité</h3>
      <div className="form-grid four">
        <Field label="Prix / mois (TND) *" name="price_tnd" error={errors.price_tnd}>
          <input id="price_tnd" name="price_tnd" type="number" min={1} defaultValue={v.text("price_tnd", listing?.price_tnd)} required />
        </Field>
        <Field label="Disponible dès *" name="available_from" error={errors.available_from}>
          <input id="available_from" name="available_from" type="date" defaultValue={v.text("available_from", listing?.available_from)} required />
        </Field>
        <Field label="Capacité (étudiants)" name="capacity" error={errors.capacity}>
          <input id="capacity" name="capacity" type="number" min={1} defaultValue={v.text("capacity", listing?.capacity ?? 1)} />
        </Field>
        <Field label="Places disponibles" name="available_places" error={errors.available_places}>
          <input id="available_places" name="available_places" type="number" min={0} defaultValue={v.text("available_places", listing?.available_places ?? 1)} />
        </Field>
        <Field label="Minutes à pied du campus" name="walk_minutes" error={errors.walk_minutes}>
          <input id="walk_minutes" name="walk_minutes" type="number" min={0} defaultValue={v.text("walk_minutes", listing?.walk_minutes ?? 10)} />
        </Field>
        <Field label="Options 24 h (total)" name="hold_slots_total">
          <input id="hold_slots_total" name="hold_slots_total" type="number" min={0} defaultValue={v.text("hold_slots_total", listing?.hold_slots_total ?? 3)} />
        </Field>
        <Field label="Options 24 h libres" name="hold_slots_available">
          <input id="hold_slots_available" name="hold_slots_available" type="number" min={0} defaultValue={v.text("hold_slots_available", listing?.hold_slots_available ?? 3)} />
        </Field>
        <div className="form-field checkbox-cell">
          <Checkbox name="service_included" label="Service Nestora inclus" defaultChecked={v.checked("service_included", listing?.service_included ?? true)} />
        </div>
      </div>

      <h3 className="form-section-title">Équipements</h3>
      <div className="check-grid">
        {AMENITIES.map(([name, label]) => <Checkbox key={name} name={name} label={label} defaultChecked={v.checked(name, listing?.[name])} />)}
      </div>

      <h3 className="form-section-title">Confiance</h3>
      <div className="form-grid four">
        <div className="form-field wide check-grid">
          {TRUST.map(([name, label]) => <Checkbox key={name} name={name} label={label} defaultChecked={v.checked(name, listing?.[name])} />)}
        </div>
        <Field label="Housing Confidence (0-100)" name="confidence_score" error={errors.confidence_score}>
          <input id="confidence_score" name="confidence_score" type="number" min={0} max={100} defaultValue={v.text("confidence_score", listing?.confidence_score)} />
        </Field>
      </div>

      <h3 className="form-section-title">À proximité (minutes)</h3>
      <div className="form-grid four">
        {NEARBY.map(([kind, label]) => (
          <Field key={kind} label={label} name={`nearby_${kind}`}>
            <input id={`nearby_${kind}`} name={`nearby_${kind}`} type="number" min={0} max={999} defaultValue={v.text(`nearby_${kind}`, nearby[kind])} />
          </Field>
        ))}
      </div>

      <h3 className="form-section-title">Conditions</h3>
      <div className="form-grid">
        <Field label="Dépôt de garantie" name="deposit_label">
          <input id="deposit_label" name="deposit_label" defaultValue={v.text("deposit_label", listing?.deposit_label ?? "1 mois de loyer")} />
        </Field>
        <Field label="Charges" name="charges_label">
          <input id="charges_label" name="charges_label" defaultValue={v.text("charges_label", listing?.charges_label ?? "Eau et électricité non incluses")} />
        </Field>
        <Field label="Visites" name="visits_label">
          <input id="visits_label" name="visits_label" defaultValue={v.text("visits_label", listing?.visits_label ?? "Sur demande et confirmation")} />
        </Field>
      </div>

      <h3 className="form-section-title">Mise en avant sur l’accueil</h3>
      <div className="check-grid">
        {COLLECTIONS.map(([value, label]) => (
          <Checkbox key={value} name="collections" value={value} label={label} defaultChecked={v.list("collections", listing?.collections ?? []).includes(value)} />
        ))}
      </div>

      <h3 className="form-section-title">Photos</h3>
      <div className={`form-field wide ${errors.photos ? "has-error" : ""}`}>
        {photos.length > 0 && (
          <ul className="photo-list">
            {photos.map((url, index) => (
              <li key={url}>
                <input type="hidden" name="keep_photos" value={url} />
                <span className="thumb large" style={{ backgroundImage: `url('${url}')` }} role="img" aria-label={`Photo ${index + 1}`} />
                {index === 0 && <span className="photo-cover">Couverture</span>}
                <button type="button" className="photo-remove" onClick={() => setPhotos(photos.filter((item) => item !== url))} aria-label={`Retirer la photo ${index + 1}`}><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="photos" className="field-label-text">Ajouter des photos</label>
        <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
        {errors.photos ? <p className="field-error" role="alert">{errors.photos}</p> : <p className="field-hint">8 photos maximum, 3 Mo chacune. La première est la photo de couverture.</p>}
      </div>

      <div className="form-footer">
        <span />
        <div className="form-actions">
          <Link href="/properties" className="button-outline">Annuler</Link>
          <SubmitButton>{listing ? "Enregistrer la maison" : "Créer la maison"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
