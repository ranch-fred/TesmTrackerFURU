# Cool Name Pending #30439 — Team Console

A black-and-orange, mobile-friendly FTC team workspace for the team-provided 2026–27 BIOBUZZ season. Built for **GitHub → Vercel**, with **Supabase** accounts, shared Postgres data, private file uploads and role-based access.

No generated robot images are included, as requested. The interface uses typography, blueprint grids and a simple CSS dimensional schematic. The requested Higgsfield video submission was rejected for insufficient workspace video credits; no video is included or claimed complete.

## Layout and motion update

The console now uses larger type, roomier forms and tables, clearer section headings, and a dashboard shortcut bar for tasks, expenses and outreach. Cards reveal as they enter the viewport; stat totals count up; the landing blueprint and header grid move subtly; buttons, navigation, dialogs and charts have coordinated transitions. Use the pause/play control in the header to turn motion off or on. The preference is saved on the device, and the app respects the system's reduced-motion setting. This update adds no generated robot imagery and does not change the database schema.

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the printed localhost address and choose **Explore team console**. Demo mode has fictional sample data, stores edits on the current device, and deliberately does not impersonate live accounts or shared uploads. Demo is always available even after Supabase is connected.

## Connect the real backend

For Google login and Vercel's existing Supabase integration, follow [the Google sign-in setup guide](docs/GOOGLE_SIGN_IN.md). The login screen now supports Google alongside email/password, and new members default to joining an existing team.

1. Create a Supabase project you control.
2. In its SQL editor, run **supabase/schema.sql** once in a new project. It creates the application tables, private storage bucket, guarded administration functions, audit triggers, Realtime policies and row-level permissions. It is an initial migration, not an idempotent reset script.
3. In Supabase Authentication settings, enable email/password and email confirmation. Set the Site URL to the production Vercel URL. Add localhost and your actual Vercel production/preview URLs to the allowed redirect URLs. Configure your own SMTP provider for reliable confirmation email delivery. The app sends in-app announcement notifications, not announcement emails.
4. In Realtime settings, disable **Allow public access**. Team presence uses private channels and membership authorization. See [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).
5. Copy `.env.example` to `.env.local`, then fill in the project URL and **publishable key**. Restart the development server.

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Only the public/publishable client key belongs in Vite variables. **Never use a service-role or secret key in this browser application.** Access is enforced by Postgres policies, not by hiding client keys.

After setup, sign up using a real email address and follow the confirmation email. Create the team using the production account. Demo records are not automatically inserted into production. To test with them, export JSON in demo Settings, sign in to the real team and import it. All sample contacts use example.com or explicit sample labels.

## Deploy on Vercel from the supplied GitHub repository

Repository: [ranch-fred/TesmTrackerFURU](https://github.com/ranch-fred/TesmTrackerFURU).

1. Import the repository into Vercel and select the branch containing this application.
2. Use the repository root as **Root Directory**. Choose the **Vite** preset.
3. Build command: `npm run build`. Output directory: `dist`. Install command: `npm ci`.
4. Set both `VITE_SUPABASE_*` environment variables for Production and any Preview environments you want to use. These are injected at build time, so redeploy after changing them.
5. Deploy, then add the returned URL to Supabase Auth as described above. Test signup, approval, storage upload and restricted roles with separate accounts.

`vercel.json` already declares the build output and single-page fallback. No Cloudflare Worker, Sites runtime, server-side filesystem storage, or proprietary hosting dependency is required. `package-lock.json` pins the installed dependencies. GitHub does not store `.env.local` or `node_modules`.

## Captain and member guide

- **Create a team:** Sign up → confirm email → sign in → Create team. Enter full name, grade, team name/number, school, season, location and logo URL. A private logo upload can be added in Team settings after team creation. The creator becomes an approved captain and owner.
- **Invite and approve:** Team settings → Invites → Copy invite link. Members sign up and submit name, grade, requested role and multiple sub-teams. Captains/coaches approve or deny under Members. Approval grants the requested role; check it before approving. Members see onboarding after approval.
- **Expense:** Business & finance → Log expense. Enter date, description, amount, category, paid by, receipt URL/upload, and reimbursement status. Files must be PNG, JPEG, WebP, PDF or plain text up to 10 MB. Receipts remain in a private bucket and are opened using short-lived signed URLs.
- **Match:** Match analytics → Add record. Log match identity, alliance/partner, drive team, all supplied game metrics, points, notes and issues. Points are entered from the official result; no speculative automatic scoring is applied.
- **Outreach:** Outreach & connect → Add record. Enter date, event type, hours, audience, reach, professional connections, lead speaker, impact and follow-up. Totals update from the records.
- **Tasks:** Drag between the four columns, or use each task’s status selector with a keyboard. Search, filter, sort, edit and export are available. Overdue dates are highlighted.
- **Attendance:** Tap member names in a session to toggle presence. Use the calendar tab and per-person attendance/hours summary. Sessions must start and finish on the same date.
- **Meeting actions:** Put one action per line, then Create tasks. The conversion avoids repeating the same meeting/title pair.
- **Portfolio:** Pull source entries from designs, code, outreach, funding and robot specs. Existing draft edits are preserved; edit sections and ordering before PDF export.
- **Reports:** Export season, finance, outreach and attendance PDFs/CSVs. Packing lists have an inventory-based builder and a print stylesheet.
- **Team access:** Roster roles are descriptive. Account roles are managed only in Team settings. Multiple captains/coaches are supported. Only the current owner can transfer ownership; transfer before removing or demoting the owner.

## Records and source map

- `src/schema.js`: all requested record fields, including extra robot, hardware, budget, milestone and risk sections.
- `src/Auth.jsx`: landing, account and membership request screens.
- `src/store.jsx`: demo storage, Supabase record operations, private uploads, refresh and presence.
- `src/Views.jsx`: dashboard, finance, robot checks, match charts, judging practice, portfolio and reports.
- `src/Records.jsx`: searchable/filterable/sortable lists, forms, comments, CSV, Kanban, attendance and calendar.
- `src/Settings.jsx`: profile, member management, invites, preferences and import/export.
- `supabase/schema.sql`: full database migration and security boundary.
- `docs/PLAN.md`: site map, data model and role matrix.
- `docs/VERIFICATION.md`: checks performed and remaining deployment verification.

## Scope and current limitations

- A real Supabase project and Vercel deployment have not been provisioned by this build. Authentication, confirmation email, production uploads and hosted Realtime still need live verification after you connect your project. Demo mode works without these credentials.
- Team creation and joining support one active team per account in the UI. The database supports multiple memberships; no team switcher is implemented.
- Presence means an active connection to the console, not a permanent record of everyone signed into Supabase. Presence payloads are self-reported; access permissions always come from the database membership.
- Rule thresholds start **unverified**. The supplied season title and game fields have not been asserted to be official. Add the official manual, enter verified limits, and physically inspect the robot. The checker only evaluates recorded dimensions, motor/servo counts and configured envelopes.
- Funding has the fields in the brief, not a bank ledger with dated installments. The cumulative chart groups each source’s total received by its last-contact date, clearly labeled in the interface. Sponsor finance views disclose aggregated totals only.
- Every operational list supports search, a field filter, sorting, edits, captain/coach deletion confirmation and CSV. Parent/sponsor views and protected audit records are intentionally read-only. Audit entries include before/after data; they are visible only to operational roles.
- JSON export contains operational records and team profile. It is not a database backup of accounts, membership grants, audit history, notification state or uploaded binaries. CSV exports neutralize spreadsheet formulas. Imports add records, validate fields, and cannot grant roles. Imports are sequential; retrying after a partial import can duplicate earlier rows.
- Uploaded file paths are private references, not public portable URLs. Removing a record does not delete its attachment object; storage cleanup is an administrator operation in Supabase.
- Concurrent record editing uses last-write-wins. Pagination is not implemented for large seasons; Supabase row-return limits may require server-side pagination as the dataset grows.
- Typography is loaded from Google Fonts, with local fallbacks when offline.

## Checks

```sh
npm test
npm run test:db
npm run build
```

The database test runs the actual migration against embedded PostgreSQL with mocked Supabase identity/storage/Realtime infrastructure. It verifies record authorization, approvals, ownership, audits and finance boundaries. It does not substitute for live Supabase Auth/Storage/Realtime testing.
