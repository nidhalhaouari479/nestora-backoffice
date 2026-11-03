"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { NavIcon } from "./NavIcon";
import { isActive, type NavGroup } from "./nav";

export type SidebarProps = {
  groups: NavGroup[];
  user: { name: string; roleLabel: string };
  brandSubtitle: string;
  logoutHref: string;
  collapsed: boolean;
  variant: "desktop" | "drawer";
  onOpenSearch?: () => void;
  onToggleCollapse?: () => void;
  onClose?: () => void;
};

export function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function Sidebar({ groups, user, brandSubtitle, logoutHref, collapsed, variant, onOpenSearch, onToggleCollapse, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar sidebar-${variant}`} data-collapsed={collapsed ? "true" : undefined}>
      <div className="sidebar-brand">
        <BrandLogo size={34} onLight />
        <div className="sidebar-brand-text">
          <strong>Nestora</strong>
          <small>{brandSubtitle}</small>
        </div>
        {variant === "drawer" && (
          <button type="button" className="ghost-icon sidebar-close" aria-label="Fermer le menu" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        )}
      </div>

      {onOpenSearch && (
        <button type="button" className="sidebar-search" onClick={onOpenSearch} title={collapsed ? "Rechercher (Ctrl K)" : undefined}>
          <Search size={16} aria-hidden="true" />
          <span className="sidebar-label">Rechercher…</span>
          <kbd className="sidebar-label">Ctrl K</kbd>
          {collapsed && <span className="sr-only">Rechercher</span>}
        </button>
      )}

      <nav className="sidebar-nav" aria-label="Navigation">
        {groups.map((group) => (
          <div key={group.label} className="nav-group">
            <p className="nav-group-label">{group.label}</p>
            <ul>
              {group.items.map((item) => {
                const active = isActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="nav-item" aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined}>
                      <NavIcon name={item.icon} size={18} strokeWidth={active ? 2.2 : 1.8} />
                      <span className="sidebar-label">{item.label}</span>
                      {item.badge ? <span className="nav-badge">{item.badge > 99 ? "99+" : item.badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-avatar" aria-hidden="true">{initials(user.name)}</span>
          <div className="sidebar-label">
            <strong>{user.name}</strong>
            <small>{user.roleLabel}</small>
          </div>
          <form action={logoutHref} method="post" className="sidebar-label">
            <button type="submit" className="ghost-icon" aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={16} aria-hidden="true" /></button>
          </form>
        </div>
        {variant === "desktop" && (
          <button type="button" className="sidebar-collapse" onClick={onToggleCollapse} aria-expanded={!collapsed} title={collapsed ? "Déplier le menu" : undefined}>
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
            <span className="sidebar-label">Réduire le menu</span>
            {collapsed && <span className="sr-only">Déplier le menu</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
