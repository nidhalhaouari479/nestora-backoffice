# Nestora · Backoffice (portail de management)

Application Next.js 16 pour l’équipe : AP1A_01 → AP1A_05 et AP1A_18.
Elle partage la base Supabase du storefront (migrations dans `../nestora/supabase`).

## Démarrage

```bash
cp .env.example .env.local   # puis remplir les valeurs
npm install
npm run dev                  # http://localhost:3001
```

## Sécurité

| Écran | Route | Fonctionnement |
| --- | --- | --- |
| AP1A_01 Secure Team Login | `/login` | email + mot de passe Supabase ; seuls les `staff_members` actifs passent |
| AP1A_02 Two-Factor Authentication | `/verify` | code à 6 chiffres envoyé par email (SMTP), haché HMAC-SHA256 avec `ADMIN_2FA_SECRET`, 5 essais max |
| AP1A_03 Session Expired | `/session-expired` | affiché quand une session staff est révoquée (pas d’expiration pour inactivité) |
| AP1A_18 Access Denied | `/access-denied` | chaque module exige une permission du rôle ; les refus sont écrits dans `audit_log` |
| AP1A_04 Command Center | `/command-center` | indicateurs via `ops_command_center_stats()` |
| AP1A_05 My Workspace | `/workspace` | tâches et planning assignés via `ops_workspace_stats()` |
| Visites | `/visits` | l’étudiant propose 1 à 7 jours (un créneau chacun) ; l’équipe retient la date finale via `staff_confirm_visit()` |
| Étudiants | `/students`, `/students/[id]` | étudiants inscrits sur le site via `staff_list_students()` / `staff_get_student()` (permission `students.view`) |

Les données sont lues avec la session de l’utilisateur : les policies RLS (`is_verified_staff()`)
refusent tout accès tant que la 2FA n’est pas validée ou si la session a été révoquée.
La clé `SUPABASE_SERVICE_ROLE_KEY` sert uniquement côté serveur (codes 2FA, sessions, journal d’audit).

En développement, si `SMTP_HOST` est vide, le code 2FA est affiché dans la console du serveur.

## Créer le premier administrateur

1. Supabase → *Authentication → Users → Add user* : email + mot de passe, *Auto Confirm User*.
2. Dans *SQL Editor* (remplacer l’email et le nom) :

```sql
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"account_type":"staff"}'
where email = 'admin@nestora.tn';

-- Le trigger d'inscription étudiant a pu créer un profil : on le retire.
delete from public.student_profiles where email = 'admin@nestora.tn';

insert into public.staff_members (user_id, full_name, email, role)
select id, 'Prénom Nom', email, 'super_admin' from auth.users where email = 'admin@nestora.tn';

-- Optionnel (données de démo) : assigner les tâches et le planning à cet administrateur.
update public.ops_tasks set assignee_id = (select id from auth.users where email = 'admin@nestora.tn') where assignee_id is null;
update public.ops_schedule_events set assignee_id = (select id from auth.users where email = 'admin@nestora.tn') where assignee_id is null;
```

Rôles disponibles : `super_admin`, `operations_manager`, `operations_agent`, `finance`, `field_agent`, `content_editor`
(permissions dans `public.staff_role_permissions`).
