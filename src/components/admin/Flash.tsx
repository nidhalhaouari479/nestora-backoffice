import { CheckCircle2 } from "lucide-react";

const MESSAGES: Record<string, string> = {
  created: "Enregistrement créé.",
  updated: "Modifications enregistrées.",
  activated: "Réactivé.",
  deactivated: "Désactivé.",
};

// Confirmation shown after a redirect (?saved=created|updated|…).
export function Flash({ saved }: { saved?: string | string[] }) {
  const key = Array.isArray(saved) ? saved[0] : saved;
  if (!key || !MESSAGES[key]) return null;
  return <p className="notice notice-success flash" role="status"><CheckCircle2 size={16} aria-hidden="true" />{MESSAGES[key]}</p>;
}
