"use client";

import { Trash2 } from "lucide-react";
import { deleteFeatureAction } from "./actions";

export function DeleteFeatureButton({ id, kind, name, houses }: { id: string; kind: string; name: string; houses: number }) {
  return (
    <form
      action={deleteFeatureAction}
      className="inline-form"
      onSubmit={(event) => {
        const warning = houses > 0 ? `\n\nElle sera retirée de ${houses} maison${houses > 1 ? "s" : ""}.` : "";
        if (!window.confirm(`Supprimer « ${name} » ?${warning}`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <button type="submit" className="table-link danger-link"><Trash2 size={14} aria-hidden="true" />Supprimer</button>
    </form>
  );
}
