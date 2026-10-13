"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Brand } from "@/components/BrandLogo";
import { NAV_GROUPS } from "@/lib/auth/permissions";
import { NavIcon } from "./NavIcon";

type Props = {
  permissions: string[];
  counts: { open_tasks: number | null; payments_to_verify: number | null };
  user: { name: string; roleLabel: string };
};

export function Sidebar({ permissions, counts, user }: Props) {
  const pathname = usePathname();
  const groups = NAV_GROUPS
    .map((group) => ({ ...group, sections: group.sections.filter((section) => permissions.includes(section.permission)) }))
    .filter((group) => group.sections.length > 0);

  return (
    <aside className="sidebar">
      <Brand compact />
      <nav className="sidebar-nav" aria-label="Navigation du portail">
        {groups.map((group) => (
          <div key={group.label} className="nav-group">
            <p className="nav-group-label">{group.label}</p>
            <ul>
              {group.sections.map((section) => {
                const badge = section.badge ? counts[section.badge] : null;
                const active = pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`);
                return (
                  <li key={section.slug}>
                    <Link href={`/${section.slug}`} className="nav-item" aria-current={active ? "page" : undefined}>
                      <NavIcon name={section.icon} />
                      <span>{section.label}</span>
                      {badge ? <span className="nav-badge">{badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="sidebar-avatar" aria-hidden="true">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{user.name}</strong>
          <small>{user.roleLabel}</small>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="sidebar-logout" aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={17} /></button>
        </form>
      </div>
    </aside>
  );
}
