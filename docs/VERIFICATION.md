# Verification record

## Google sign-in revision

- Connected the local preview to the user-supplied public Supabase configuration in ignored `.env.local`.
- A read-only request to Auth settings succeeded and reported Google disabled. The REST API reported the `teams` table missing. Live Google login and team creation remain blocked on provider setup and the initial migration.
- Added automated checks for OAuth request parameters, invitation persistence/expiry, safe callback errors, public Vercel environment aliases, rejection of browser-secret keys, and actual login/invite/pending/join screen rendering.
- Chrome inspection was stopped because its current URL could not be verified. No browser-based Google flow was performed.

## Layout and motion revision

- Production build and all ten application tests passed after the visual changes.
- Browser reviewed the updated dashboard, larger typography, action strip and form layout.
- Verified the pause control changes to Play animations, and resumes on the next click.
- Verified the dashboard Log outreach shortcut opens the complete outreach entry form.
- Motion respects system reduced-motion preferences, and the pause control also disables chart animation.
- Database and permission behavior was unchanged; the original database verification below still describes the backend checks performed.

## Passed

- Production Vite build.
- Ten automated tests for received-vs-pledged finance totals, attendance hours, unverified legality, motor/servo/dimension envelopes, role capabilities, CSV quote/formula safety, typed CSV import, invalid imports and cumulative trends.
- Twenty-three embedded PostgreSQL checks against the actual migration: team/captain creation, creation audits, announcement notification creation, owner field protection, unrelated-account isolation, finance and invite RPC checks, requested-role non-escalation, pending-member isolation, direct membership escalation protection, member creation/delete/settings limits, negative finance validation, sponsor finance privacy, audit privacy, sponsor write prevention, mentor edit grants/comments, owner demotion protection and ownership transfer.
- Browser inspection of landing, demo dashboard, mobile layout, finance overview, and expense creation. A $25 demo expense immediately changed the balance from $3,168 to $3,143 and money spent from $1,682 to $1,707.

- Dependency audit: zero known vulnerabilities after upgrading the PDF library.

## Needs live project configuration

- Email confirmation and production sign-in.
- Shared writes from multiple browser accounts.
- Storage upload, signed downloads and file-size policies.
- Private Realtime presence and production membership authorization.
- Hosted Vercel deployment and Auth redirect domain.

The app is provided as source and an executable local demo. It is not described as a deployed, connected production service.
