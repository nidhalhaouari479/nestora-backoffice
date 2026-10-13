"use client";

import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Search } from "lucide-react";
import { findSection } from "@/lib/auth/permissions";

export function Topbar({ today, notifications }: { today: string; notifications: number }) {
  const pathname = usePathname();
  const title = findSection(pathname.split("/")[1] ?? "")?.label ?? "Nestora Ops";
  return (
    <header className="topbar">
      <div className="topbar-title">
        <p className="eyebrow">Nestora Ops</p>
        <h1>{title}</h1>
      </div>
      <form className="topbar-search" role="search" action="/students">
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="portal-search">Rechercher</label>
        <input id="portal-search" name="q" placeholder="Rechercher un étudiant, un bien, une référence…" />
        <kbd>⌘<br />K</kbd>
      </form>
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label={`${notifications} notifications`}>
          <Bell size={19} aria-hidden="true" />
          {notifications > 0 && <span className="icon-badge">{notifications}</span>}
        </button>
        <span className="date-chip"><CalendarDays size={16} aria-hidden="true" />{today}</span>
      </div>
    </header>
  );
}
