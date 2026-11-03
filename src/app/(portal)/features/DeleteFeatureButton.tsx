"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { confirmDialog } from "@/components/FeedbackHost";
import { deleteFeatureAction } from "./actions";

export function DeleteFeatureButton({ id, kind, name, houses }: { id: string; kind: string; name: string; houses: number }) {
  const confirmed = useRef(false);
  return (
    <form
      action={deleteFeatureAction}
      className="inline-form"
      onSubmit={async (event) => {
        if (confirmed.current) { confirmed.current = false; return; }
        event.preventDefault();
        const form = event.currentTarget;
        const ok = await confirmDialog({
          title: `Supprimer « ${name} » ?`,
          message: houses > 0 ? `Elle sera retirée de ${houses} maison${houses > 1 ? "s" : ""}.` : "Aucune maison n’utilise cette caractéristique.",
          confirmLabel: "Supprimer la caractéristique",
          tone: "danger",
        });
        if (!ok) return;
        confirmed.current = true;
        form.requestSubmit();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <button type="submit" className="table-link danger-link"><Trash2 size={14} aria-hidden="true" />Supprimer</button>
    </form>
  );
}
