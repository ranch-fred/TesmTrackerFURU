# Verification record

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
