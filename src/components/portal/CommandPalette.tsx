"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, Users } from "lucide-react";
import { NAV_GROUPS } from "@/lib/auth/permissions";
import { NavIcon } from "./NavIcon";

type Item = { key: string; label: string; hint: string; href: string; icon: React.ReactNode };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Ctrl K: jump to a section, or search a student by name / email / phone.
export function CommandPalette({ permissions, onClose }: { permissions: string[]; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<Item[]>(() => {
    const q = normalize(query.trim());
    const sections = NAV_GROUPS.flatMap((group) => group.sections
      .filter((section) => permissions.includes(section.permission))
      .filter((section) => !q || normalize(`${section.label} ${group.label}`).includes(q))
      .map((section) => ({ key: section.slug, label: section.label, hint: group.label, href: `/${section.slug}`, icon: <NavIcon name={section.icon} size={16} /> })));
    const studentSearch = q && permissions.includes("students.view")
      ? [{ key: "students-search", label: `Rechercher « ${query.trim()} » dans les étudiants`, hint: "Étudiants", href: `/students?q=${encodeURIComponent(query.trim())}`, icon: <Users size={16} aria-hidden="true" /> }]
      : [];
    return [...sections.slice(0, 8), ...studentSearch];
  }, [permissions, query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const go = (item?: Item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  return (
    <div className="modal-backdrop palette-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal palette" role="dialog" aria-modal="true" aria-label="Recherche">
        <label className="palette-input">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Rechercher une section ou un étudiant</span>
          <input
            ref={inputRef}
            value={query}
            placeholder="Aller à une section, chercher un étudiant…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={items[active] ? `palette-${items[active].key}` : undefined}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => Math.min(index + 1, items.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)); }
              if (event.key === "Enter") { event.preventDefault(); go(items[active]); }
            }}
          />
          <kbd>Échap</kbd>
        </label>
        {items.length === 0 ? (
          <p className="palette-empty">Aucun résultat.</p>
        ) : (
          <ul id="palette-results" className="palette-results" role="listbox" aria-label="Résultats">
            {items.map((item, index) => (
              <li
                key={item.key}
                id={`palette-${item.key}`}
                role="option"
                aria-selected={index === active}
                className="palette-item"
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => { event.preventDefault(); go(item); }}
              >
                <span className="palette-icon">{item.icon}</span>
                <span className="palette-label">{item.label}</span>
                <span className="palette-hint">{item.hint}</span>
                {index === active && <CornerDownLeft size={14} aria-hidden="true" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
