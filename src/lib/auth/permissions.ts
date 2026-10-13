export type StaffRole = "super_admin" | "operations_manager" | "operations_agent" | "finance" | "field_agent" | "content_editor";

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super administrateur",
  operations_manager: "Responsable Opérations",
  operations_agent: "Agent Opérations",
  finance: "Finance",
  field_agent: "Agent terrain",
  content_editor: "Éditeur de contenu",
};

export type NavIcon =
  | "grid" | "user-check" | "list" | "check" | "calendar-range" | "alert" | "home" | "shield" | "calendar"
  | "users" | "calendar-days" | "clock" | "key" | "file" | "card" | "key-round" | "chart" | "layout"
  | "building" | "bell" | "megaphone" | "users-cog" | "scroll" | "contact";

export type Section = {
  slug: string;
  label: string;
  permission: string;
  icon: NavIcon;
  badge?: "open_tasks" | "payments_to_verify";
  // Shown on the Access Denied screen (AP1A_18).
  deniedAction: string;
};

export const NAV_GROUPS: { label: string; sections: Section[] }[] = [
  {
    label: "Contrôle",
    sections: [
      { slug: "command-center", label: "Command Center", permission: "command_center.view", icon: "grid", deniedAction: "d’ouvrir le Command Center" },
      { slug: "workspace", label: "Mon espace", permission: "workspace.view", icon: "user-check", deniedAction: "d’ouvrir l’espace personnel" },
      { slug: "actions", label: "File d’actions", permission: "actions.view", icon: "list", badge: "open_tasks", deniedAction: "de consulter la file d’actions" },
      { slug: "approvals", label: "Approbations", permission: "approvals.view", icon: "check", deniedAction: "de valider des approbations" },
      { slug: "planning", label: "Planning", permission: "planning.view", icon: "calendar-range", deniedAction: "de consulter le planning" },
      { slug: "exceptions", label: "Exceptions", permission: "exceptions.view", icon: "alert", deniedAction: "de traiter les exceptions" },
    ],
  },
  {
    label: "Offre",
    sections: [
      { slug: "landlords", label: "Clients", permission: "landlords.view", icon: "contact", deniedAction: "de consulter les clients propriétaires" },
      { slug: "properties", label: "Maisons", permission: "properties.view", icon: "home", deniedAction: "de gérer les maisons" },
      { slug: "universities", label: "Facultés", permission: "universities.view", icon: "building", deniedAction: "de gérer les facultés" },
      { slug: "verification", label: "Vérification", permission: "verification.view", icon: "shield", deniedAction: "de vérifier les biens" },
      { slug: "availability", label: "Disponibilités", permission: "availability.view", icon: "calendar", deniedAction: "de modifier les disponibilités" },
    ],
  },
  {
    label: "Étudiants",
    sections: [
      { slug: "students", label: "Étudiants", permission: "students.view", icon: "users", deniedAction: "de consulter les dossiers étudiants" },
      { slug: "visits", label: "Visites", permission: "visits.view", icon: "calendar-days", deniedAction: "de gérer les visites" },
      { slug: "holds", label: "Options 24 h", permission: "holds.view", icon: "clock", deniedAction: "de gérer les options 24 h" },
      { slug: "reservations", label: "Réservations", permission: "reservations.view", icon: "key", deniedAction: "de gérer les réservations" },
    ],
  },
  {
    label: "Transactions",
    sections: [
      { slug: "contracts", label: "Contrats", permission: "contracts.view", icon: "file", deniedAction: "de consulter les contrats" },
      { slug: "payments", label: "Paiements", permission: "payments.view", icon: "card", badge: "payments_to_verify", deniedAction: "d’approuver un paiement ni de modifier les coordonnées bancaires de l’entreprise" },
      { slug: "move-ins", label: "Emménagements", permission: "move_ins.view", icon: "key-round", deniedAction: "de gérer les emménagements" },
      { slug: "rent", label: "Loyers & reçus", permission: "rent.view", icon: "chart", deniedAction: "de consulter les loyers et reçus" },
    ],
  },
  {
    label: "Application",
    sections: [
      { slug: "content", label: "Contenu & accueil", permission: "content.view", icon: "layout", deniedAction: "de modifier le contenu de l’application" },
      { slug: "notifications", label: "Notifications", permission: "notifications.view", icon: "bell", deniedAction: "d’envoyer des notifications" },
    ],
  },
  {
    label: "Pilotage",
    sections: [
      { slug: "marketing", label: "Marketing & leads", permission: "marketing.view", icon: "megaphone", deniedAction: "de consulter le marketing" },
      { slug: "team", label: "Équipe & accès", permission: "team.manage", icon: "users-cog", deniedAction: "de gérer l’équipe et les accès" },
      { slug: "audit", label: "Journal d’audit", permission: "audit.view", icon: "scroll", deniedAction: "de consulter le journal d’audit" },
    ],
  },
];

export const SECTIONS = NAV_GROUPS.flatMap((group) => group.sections);

export function findSection(slug: string) {
  return SECTIONS.find((section) => section.slug === slug);
}

// First screen the role is allowed to open after login.
export function homeFor(permissions: string[]) {
  return SECTIONS.find((section) => permissions.includes(section.permission))?.slug ?? "workspace";
}
