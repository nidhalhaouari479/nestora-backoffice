"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Feature, FEATURE_KINDS } from "@/lib/catalog-shared";
import { FeatureIcon } from "@/components/admin/FeatureIcon";

type Kind = (typeof FEATURE_KINDS)[number];

type Props = {
  kind: Kind;
  features: Feature[];
  selected: string[];
  valueFor: (id: string) => string;
  errors: Record<string, string>;
};

// One list on the house form: tick an item to turn it on, then fill its value.
export function FeatureSection({ kind, features, selected, valueFor, errors }: Props) {
  const visible = features.filter((feature) => feature.is_active || selected.includes(feature.id));

  return (
    <>
      <div className="form-section-heading">
        <h3 className="form-section-title">{kind.label}</h3>
        <Link href={`/features/new?kind=${kind.value}`} className="table-link" target="_blank"><Plus size={14} aria-hidden="true" />{kind.add}</Link>
      </div>
      {visible.length === 0
        ? <p className="field-hint">Aucun élément : <Link href={`/features/new?kind=${kind.value}`} className="table-link" target="_blank">ajoute-en un</Link>, puis recharge la page.</p>
        : (
          <div className="feature-grid">
            {visible.map((feature) => (
              <FeatureRow key={feature.id} feature={feature} kind={kind} initiallyOn={selected.includes(feature.id)} value={valueFor(feature.id)} error={errors[`feature_${feature.id}`]} />
            ))}
          </div>
        )}
    </>
  );
}

function FeatureRow({ feature, kind, initiallyOn, value, error }: { feature: Feature; kind: Kind; initiallyOn: boolean; value: string; error?: string }) {
  const [on, setOn] = useState(initiallyOn);
  const valueName = `feature_value_${feature.id}`;

  return (
    <div className={`feature-row ${on ? "is-on" : ""} ${error ? "has-error" : ""}`}>
      <label className="feature-toggle">
        <input type="checkbox" name="features" value={feature.id} checked={on} onChange={(event) => setOn(event.target.checked)} />
        <span className="feature-icon"><FeatureIcon name={feature.icon} size={16} /></span>
        <span>{feature.name}{!feature.is_active && <small> (masquée)</small>}</span>
      </label>
      {on && kind.input !== "none" && (
        <span className="feature-value">
          <label htmlFor={valueName} className="sr-only">{kind.valueLabel} · {feature.name}</label>
          <input
            id={valueName}
            name={valueName}
            defaultValue={value}
            type={kind.input === "minutes" ? "number" : "text"}
            min={kind.input === "minutes" ? 0 : undefined}
            max={kind.input === "minutes" ? 999 : undefined}
            maxLength={120}
            placeholder={kind.input === "minutes" ? "5" : kind.input === "optional" ? "Optionnel" : "Valeur"}
          />
          {kind.input === "minutes" && <span className="feature-suffix">min</span>}
        </span>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
