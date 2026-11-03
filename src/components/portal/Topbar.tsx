"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { initials } from "./Sidebar";
import { findActive, type NavGroup } from "./nav";

type Props = {
  user: { name: string; roleLabel: string };
  today: string;
  groups: NavGroup[];
  logoutHref: string;
  fallbackTitle: string;
  // Bell (team portal): count + where it leads. Omitted in the client portal.
  notifications?: { count: number; href: string; label: string };
  onOpenMenu: () => void;
  onOpenSearch?: () => void;
};

export function Topbar({ user, today, groups, logoutHref, fallbackTitle, notifications, onOpenMenu, onOpenSearch }: Props) {
  const pathname = usePathname();
  const sectionLabel = findActive(groups, pathname)?.item.label ?? fallbackTitle;
  const firstName = user.name.split(" ")[0] || user.name;
  const date = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="topbar">
      <button type="button" className="ghost-icon topbar-menu" aria-label="Ouvrir le menu" onClick={onOpenMenu}><Menu size={20} aria-hidden="true" /></button>
      <div className="topbar-greeting">
        <p className="topbar-hello">Bonjour, {firstName}</p>
        <p className="topbar-date">{date}</p>
      </div>
      <p className="topbar-section">{sectionLabel}</p>

      <div className="topbar-actions">
        {onOpenSearch && <button type="button" className="ghost-icon topbar-search-mobile" aria-label="Rechercher" onClick={onOpenSearch}><Search size={20} aria-hidden="true" /></button>}
        {notifications && (
          <Link href={notifications.href} className="bell-button" aria-label={`${notifications.label} : ${notifications.count}`}>
            <Bell size={22} aria-hidden="true" />
            {notifications.count > 0 && <span className="bell-badge" aria-hidden="true">{notifications.count > 9 ? "9+" : notifications.count}</span>}
          </Link>
        )}
        <AccountMenu user={user} logoutHref={logoutHref} />
      </div>
    </header>
  );
}

function AccountMenu({ user, logoutHref }: { user: Props["user"]; logoutHref: string }) {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so it closes after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((current: boolean) => boolean)) =>
    setOpenOn((current) => ((typeof value === "function" ? value(current === pathname) : value) ? pathname : null));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpenOn(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenOn(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="sidebar-avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="account-name">{user.name}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-head">
            <strong>{user.name}</strong>
            <small>{user.roleLabel}</small>
          </div>
          <form action={logoutHref} method="post">
            <button type="submit" role="menuitem" className="account-menu-item"><LogOut size={16} aria-hidden="true" />Se déconnecter</button>
          </form>
        </div>
      )}
    </div>
  );
}
