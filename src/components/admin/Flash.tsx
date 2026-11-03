"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/components/FeedbackHost";

const MESSAGES: Record<string, string> = {
  created: "Enregistrement créé.",
  updated: "Modifications enregistrées.",
  activated: "Réactivé.",
  deactivated: "Désactivé.",
  deleted: "Supprimé.",
  confirmed: "Visite confirmée.",
  cancelled: "Demande annulée.",
};

// Confirmation shown as a toast after a redirect (?saved=created|updated|…), then removed from the URL.
export function Flash({ saved }: { saved?: string | string[] }) {
  const key = Array.isArray(saved) ? saved[0] : saved;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!key || !MESSAGES[key]) return;
    notify.success(MESSAGES[key]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("saved");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [key, pathname, router, searchParams]);

  return null;
}
