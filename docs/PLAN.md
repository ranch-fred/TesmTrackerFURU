# FTC Team Tracker — implementation plan

## Site map

Entry: landing, email/password sign-in and sign-up, create team, join by code or invite, approval waiting room, welcome.

Team: Mission Control, Announcements, Task Board, Roster, Attendance & Sessions, Meeting Log.
Robot: Robot Specs, Subsystems, Hardware Map, Inspection, Legality Limits, Programming Log, Engineering Design, Parts & Inventory.
Competition: Match Analytics, Events & Results, Milestones, Risks, Packing Lists, Manual & Resources.
Business: Finance overview, Expenses, Funding, Purchase Requests, Category Budgets.
Outreach: Outreach & Connect, Judging Prep, Portfolio Builder, Reports.
Administration: Team Settings, Members & Approvals, Invites, Notification Preferences, Import/Export, Activity Log.

## Integrations

- Sites skill: project workflow and portability review. User chose Vercel, so no Sites production deployment.
- React + Vite: responsive app and static production bundle; Vercel GitHub deployments.
- Supabase Auth: email/password accounts. Supabase Postgres: shared team data, row-level permissions, audit trail, approval and ownership transactions. Supabase private Storage: receipts, CAD and photos. Realtime: record refresh and active member presence.
- Recharts: financial and performance visualizations.
- jsPDF: downloadable reports and portfolio; native print stylesheet: packing lists.
- Lucide: consistent icons.
- Higgsfield: a concept illustration was generated but excluded after the user requested no generated robot images. The video submission was rejected for insufficient credits. The final site uses no generated robot imagery.
- Browser APIs: CSV and JSON download, search, drag/drop, keyboard forms, local demo persistence, in-app notifications. Demo data is fictional.

## Data model

`auth.users`: Supabase-managed identity. `teams`: id, owner_id, name, number, school, season, logo, location, join_code, created_at. `memberships`: id, team_id, user_id, name, grade, requested_role, role, subteams[], status, mentor_edit, notification_preferences, onboarded, created_at. `records`: id, team_id, kind, data JSONB, created_by, created_at, updated_at. Each record kind and every JSON field is defined in `src/schema.js`; this is the canonical complete field dictionary. `comments`: id, team_id, record_id, user_id, message, created_at. `notifications`: id, team_id, title, targets[], created_at. `activity`: id, team_id, actor_id, action, kind, record_id, before_data, after_data, created_at. `storage.objects`: private `team-files` bucket, paths team_id/user_id/random_name. Realtime presence is transient, never presented as persisted login truth.

Records keep all original tool fields. Roster contact fields are separate from authorization membership. A roster role is descriptive; only the member administration flow changes access. BIOBUZZ match metrics are user-defined fields, not claims of official rules. Official recorded points drive analytics; no invented scoring formula. Income trend uses last contact date as a proxy; totals reflect recorded received amounts, not a bank ledger.

## Permissions

| Operation                                  | Captain / Coach    | Mentor                        | Member      | Parent / Sponsor       |
| ------------------------------------------ | ------------------ | ----------------------------- | ----------- | ---------------------- |
| Operational records                        | Read/write/delete  | Read/comment; edit if enabled | Read/write  | No                     |
| Dashboard, announcements, outreach         | Full               | Read/comment                  | Read/write  | Read only              |
| Finance details                            | Full               | Read; edit if enabled         | Read/write  | Aggregated totals only |
| Approvals, invites, access roles, settings | Full               | No                            | No          | No                     |
| Transfer ownership                         | Current owner only | No                            | No          | No                     |
| Audit                                      | Read               | Read                          | Read        | No                     |
| Files                                      | Read/upload/delete | Read/upload if enabled        | Read/upload | No                     |

Role and tenancy checks run in Postgres policies and narrowly scoped RPCs. UI checks improve clarity and are not the security boundary. Multiple captains/coaches supported; owner cannot be demoted or removed until transfer.
