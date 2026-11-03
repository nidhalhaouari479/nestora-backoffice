"use client";

import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumb } from "./Breadcrumb";
import { CommandPalette } from "./CommandPalette";
import type { NavGroup } from "./nav";

const COLLAPSED_KEY = "nestora:sidebar-collapsed";
const COLLAPSED_EVENT = "nestora:sidebar-collapsed-change";

function readCollapsed() {
  try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; }
}

function subscribeCollapsed(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(COLLAPSED_EVENT, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(COLLAPSED_EVENT, listener); };
}

function writeCollapsed(value: boolean) {
  try { localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0"); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(COLLAPSED_EVENT));
}

type Props = {
  groups: NavGroup[];
  user: { name: string; roleLabel: string };
  today: string;
  brandSubtitle: string;
  logoutHref: string;
  fallbackTitle: string;
  notifications?: { count: number; href: string; label: string };
  // Team portal only: Ctrl K palette over these permissions.
  searchPermissions?: string[];
  children: ReactNode;
};

// Fixed admin shell (team portal and client portal): sidebar + floating content panel. Only <main> scrolls.
export function PortalShell({ groups, user, today, brandSubtitle, logoutHref, fallbackTitle, notifications, searchPermissions, children }: Props) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const toggleCollapse = () => writeCollapsed(!collapsed);
  // The mobile drawer belongs to the page it was opened on, so it closes after navigating.
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawerOpen = drawerOn === pathname;
  const setDrawerOpen = (value: boolean) => setDrawerOn(value ? pathname : null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const hasSearch = Boolean(searchPermissions);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (hasSearch && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") setDrawerOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSearch]);

  const openSearch = hasSearch ? () => { setDrawerOpen(false); setPaletteOpen(true); } : undefined;
  const sidebarProps = { groups, user, brandSubtitle, logoutHref, onOpenSearch: openSearch };

  return (
    <div className="portal" data-collapsed={collapsed ? "true" : undefined}>
      <a href="#portal-content" className="skip-link">Aller au contenu</a>
      <Sidebar {...sidebarProps} variant="desktop" collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      {drawerOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false); }}>
          <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <Sidebar {...sidebarProps} variant="drawer" collapsed={false} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="portal-frame">
        <div className="portal-panel">
          <Topbar user={user} today={today} groups={groups} logoutHref={logoutHref} fallbackTitle={fallbackTitle}
            notifications={notifications} onOpenMenu={() => setDrawerOpen(true)} onOpenSearch={openSearch} />
          <main id="portal-content" className="portal-content" tabIndex={-1}>
            <div className="portal-container">
              <Breadcrumb groups={groups} />
              {children}
            </div>
          </main>
        </div>
      </div>

      {paletteOpen && searchPermissions && <CommandPalette permissions={searchPermissions} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
