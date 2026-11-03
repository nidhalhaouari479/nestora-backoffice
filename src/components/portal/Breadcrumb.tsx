"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { findActive, type NavGroup } from "./nav";

// "Groupe › Section › Fiche" built from the URL; hidden on mobile.
export function Breadcrumb({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const active = findActive(groups, pathname);
  if (!active) return null;
  const { group, item } = active;

  const rest = pathname.slice(item.href.length).split("/").filter(Boolean);
  const detail = rest.length === 0 ? null : rest[0] === "new" ? "Nouveau" : rest[1] === "calendar" ? "Calendrier" : "Fiche";

  return (
    <nav className="breadcrumb" aria-label="Fil d’Ariane">
      <ol>
        <li>{group.label}</li>
        <li aria-hidden="true"><ChevronRight size={14} /></li>
        <li>
          {detail ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </li>
        {detail && (
          <>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li><span aria-current="page">{detail}</span></li>
          </>
        )}
      </ol>
    </nav>
  );
}
