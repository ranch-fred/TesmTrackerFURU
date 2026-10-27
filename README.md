# FTC Team Tracker — Team Console

A black-and-orange, mobile-friendly FTC team workspace for the team-provided 2026–27 BIOBUZZ season. Built for **GitHub → Vercel**, with **Supabase** accounts, shared Postgres data, private file uploads and role-based access.

The sign-in page uses generic FTC Team Tracker branding. Once a member signs in, the sidebar, footer, robot panels, and browser title use that team's name, number, and season. The fictional demo uses a generic sample team (Demo Robotics #00000), so any team can use the site.

No generated robot images are included, as requested. The interface uses typography, blueprint grids and a simple CSS dimensional schematic. The requested Higgsfield video submission was rejected for insufficient workspace video credits; no video is included or claimed complete.

## Glass redesign

- **Design layer:** `src/construction.css` loads last and restyles the whole console as black-and-orange frosted glass: translucent panels with a bright top edge, orange glass buttons, a glass sidebar and top bar, Inter Tight headings and JetBrains Mono numbers. Only the dashboard adds the glowing-blob tiles. Every colour comes from the theme variables, so Forge (the default orange), Ocean, Forest, Violet, Paper and custom themes all still work.
- **Field background:** the sign-in and sign-up pages show a code-built 3D BIOBUZZ field behind the page (`src/hero/fieldScene.js`): foam tiles, clear walls, the A-frame hive with its four tipped hex pods and honeycomb sign, the four flowers, corner nectar rails, gardens, alliance trays and tape. It builds once, then slowly orbits. Nothing is launched and no robot is drawn. Three.js and GSAP load from a pinned CDN at runtime, so `package-lock.json` is unchanged; if WebGL or the CDN fails, the page keeps its dark background. The motion toggle holds the camera still.
- **Logs:** the Programming, Build and Outreach logs now live under one **Logs** page (`src/LogsHub.jsx`): a side-scrolling carousel of orange glass cards. Opening a card takes that log full screen, with a switcher at the top to change logs and Esc or **All logs** to go back.
- **Pill tab carousel:** `src/PillTabs.jsx` is a single-row, swipeable pill tab bar with arrows that appear only when the row overflows. It's used where sections are numerous: Competition, Robot, Finance and Team settings.
- **FTC Scout live:** Competition → FTC Scout live shows the team's official events, rank, W-L-T and matches from api.ftcscout.org for the team number in the profile. Editors can import played matches into the Matches log; already-imported matches are skipped.
- **Dashboard:** a live countdown to the next competition. The robot panel shows a size envelope instead of a drawing.
- **Search shortcut:** Ctrl/Cmd+K or / opens search.
- **Isometric loops:** three short muted loops in a dark isometric line style with one orange accent, made with the /animate skill (no robot). A hive pod filling with nectar shows when there are no matches or practice runs, a log book being written sits in the dashboard's daily-log reminder, and field tiles with a flower welcome new members. They live in `public/assets/animations/` (about 60 KB each) and hold on a still frame when motion is paused or reduced.

## Layout and motion update

The console now uses larger type, roomier forms and tables, clearer section headings, and a dashboard shortcut bar for tasks, expenses and attendance. Cards reveal as they enter the viewport; stat totals count up; the landing blueprint and header grid move subtly; buttons, navigation, dialogs and charts have coordinated transitions. Use the pause/play control in the header to turn motion off or on. The preference is saved on the device, and the app respects the system's reduced-motion setting. This update adds no generated robot imagery and does not change the database schema.

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the printed localhost address and choose **Explore demo workspace**. Demo mode has fictional sample data, stores edits on the current device, and deliberately does not impersonate live accounts or shared uploads. Demo is always available even after Supabase is connected.

## Connect the real backend

For Google login and Vercel's existing Supabase integration, follow [the Google sign-in setup guide](docs/GOOGLE_SIGN_IN.md). The login screen now supports Google alongside email/password, and new members default to joining an existing team.

### Add team deletion to an existing project

Run [`supabase/migrations/20261025_delete_team.sql`](supabase/migrations/20261025_delete_team.sql) once in the existing project's Supabase SQL Editor before deploying the updated site. The script only installs an owner-checked function; it does not delete a team. The team owner can then use **Team Settings → Delete team**, type the exact team name, and confirm. The site removes that team's private uploads first, then the function removes the team and its linked data. Google accounts remain. If file removal fails, the team remains so the owner can retry. Export records and download files beforehand if they need a copy.

### Enable shared CAD files in an existing project

Run [`supabase/migrations/20261025_cad_files.sql`](supabase/migrations/20261025_cad_files.sql) in the existing project's Supabase SQL Editor. It raises the existing private bucket's per-file limit to 50 MB and permits binary CAD uploads. The existing membership-based storage policies remain in place. The site's Engineering design page then accepts `.step`, `.stp`, `.sldprt`, `.sldasm`, `.slddrw`, and `.zip` files. Use a STEP file for interoperability, or a ZIP containing the SolidWorks assembly and referenced parts. Team members can download the original file through a short-lived signed link; the site does not render or edit CAD in-browser. Supabase's project-wide upload limit must also be at least 50 MB if the team needs that full size.

### Enable the Build log in an existing project

Run [`supabase/migrations/20261025_build_log.sql`](supabase/migrations/20261025_build_log.sql) in the existing project's Supabase SQL Editor. It adds `build` as an allowed team record type while preserving the existing entries and team permissions.

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

- **Join or create:** Sign in with Google, then create a team or enter an invite code. Captains and coaches approve membership requests in Team settings.
- **Finance:** Finance & expenses combines the overview, expenses, income, and budgets. Purchase requests is the second business tab.
- **Competition:** Matches, Events & plans, and Packing checklist are together under Competition. Event plans include milestones and risks.
- **Attendance & roster:** Approved app accounts populate the roster automatically. Accounts with team editing access can check in for today; the calendar marks Saturday and Sunday as required, past missed required days red, required-day check-ins green, and optional weekday check-ins blue. Existing session attendance remains visible in the calendar.
- **Outreach:** The Outreach log records the place, date, participants, activity, impact, and what the team gained or learned.
- **Daily logs:** The Log section contains Program, Build, and Outreach logs. Each has a short form asking for the date and what the member did; the member name is filled automatically. Outreach also asks for a place and can capture what the team gained. The dashboard reminds members to log their work each day.
- **Robot:** Click a Control Hub or Expansion Hub motor, servo, or I²C port to give it a configuration name. Use the inspection checklist to track preparations against the official 2026–27 sheet. Limits & capacity shows the current manual's limits and calculates remaining motors and servos from the counts your team enters.
- **Engineering design:** Upload STEP, SolidWorks, or ZIP CAD files so approved team members can download the originals. Files remain in private team storage.
- **FTC resources:** The Resources tab links to the current FIRST competition manual, inspection sheet, FTC Docs, Pedro Pathing, REV hub information, and other specific references. Operational members can add their own team links.
- **Themes:** Team settings → Theme offers Forge, Ocean, Forest, Violet and Paper. The selection is saved in each person's browser. To use custom colors, download the example JSON file from that tab, edit its name, dark/light mode, and seven six-digit hex colors, then upload it. The file must be 16 KB or smaller and pass text contrast checks. Images, fonts, CSS and scripts are unsupported.
- **Records:** The judging prep, portfolio, reports, subsystem and parts inventory pages are removed from navigation. Historical records remain in JSON exports and in the database so this update does not erase team work.
- **Team access:** Roster roles describe the team; account permissions are managed in Team settings. Only the current owner can transfer ownership or delete the team.

## Records and source map

- `src/schema.js`: all requested record fields, including extra robot, hardware, budget, milestone and risk sections.
- `src/Auth.jsx`: landing, account and membership request screens.
- `src/store.jsx`: demo storage, Supabase record operations, private uploads, refresh and presence.
- `src/Views.jsx`: dashboard, finance, robot checks and match charts.
- `src/Hubs.jsx`: combined attendance and competition pages.
- `src/ResourcesCenter.jsx`: official FTC directory and editable team links.
- `src/theme.js` and `src/themes.css`: theme presets, validation and appearance.
- `src/Records.jsx`: searchable/filterable/sortable lists, forms, comments, CSV, Kanban, attendance and calendar.
- `src/Settings.jsx`: profile, member management, invites, preferences, import/export and owner-only team deletion.
- `supabase/schema.sql`: full database migration and security boundary.
- `supabase/migrations/20261025_delete_team.sql`: upgrade for existing Supabase projects.
- `docs/PLAN.md`: site map, data model and role matrix.
- `docs/VERIFICATION.md`: checks performed and remaining deployment verification.

## Scope and current limitations

- The connected Supabase project and Vercel site are used for production. Live account, upload and Realtime behavior should be checked after each deployment. Demo mode works without credentials.
- Team creation and joining support one active team per account in the UI. The database supports multiple memberships; no team switcher is implemented.
- Presence means an active connection to the console, not a permanent record of everyone signed into Supabase. Presence payloads are self-reported; access permissions always come from the database membership.
- The robot limits are sourced from the official 2026–27 BIOBUZZ Competition Manual TU06. The 18 × 24 × 29 inch expanded volume is one combined envelope; the displayed 6 and 11 inch differences are explanatory, not independent allowances. Enter real measurements and inspect the robot physically; the checklist and checker do not replace event inspection.
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
