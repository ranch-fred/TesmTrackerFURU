# Enable Google sign-in for the shared team

The application now has a Google login button, PKCE session handling, invite preservation across redirects, and the existing captain approval flow. Every person signs in with their own Google account. Accounts do not receive team access until their membership is approved.

The public Supabase URL and publishable key supplied in this chat have been configured for the **local preview only**, in ignored `.env.local`. They are not committed. Production uses the environment variables configured in Vercel.

## Confirmed setup status

For project `zqhdyrnnalvqzdszczuu`, the authenticated public settings endpoint accepted the supplied browser key and reported Google disabled. The REST API reported that `public.teams` does not exist in its schema cache. These checks did not create users or alter the project.

## 1. Create the team tables

Open the [Supabase SQL editor](https://supabase.com/dashboard/project/zqhdyrnnalvqzdszczuu/sql/new), paste the full contents of `supabase/schema.sql`, and run it once. This is the initial migration for this app; do not repeatedly run it after tables exist. It creates the team, membership, record, notification, comment, audit and private-file structures and applies database permissions. No database password or service-role key belongs in the browser.

## 2. Configure Google

Following [Supabase's official Google sign-in guide](https://supabase.com/docs/guides/auth/social-login/auth-google):

1. In Google Cloud → Google Auth Platform, create or select your project, configure its branding and audience, and create a **Web application** OAuth client.
2. Add your actual Vercel production origin under **Authorized JavaScript origins**. For local testing, also add `http://localhost:5173`.
3. Add this exact **Authorized redirect URI**:

   `https://zqhdyrnnalvqzdszczuu.supabase.co/auth/v1/callback`

4. In Supabase → Authentication → Sign In / Providers → Google, enable the provider and enter the Google client ID and client secret. Enter the secret directly there; it does not belong in GitHub, Vercel public variables or chat.
5. Use only basic identity scopes: OpenID, email and profile. The app does not request Gmail, Drive or Calendar access.
6. If the Google app is in Testing mode, add the team's intended Google accounts as test users. For broader access, configure the Google audience and publishing status appropriately.

## 3. Set redirect URLs and Vercel variables

In Supabase → Authentication → URL Configuration, set the Site URL to the actual production site. Add the production origin and `http://localhost:5173/**` to the Redirect URLs allowlist, plus the preview URLs you intend to test. The app returns to `/?auth=callback` and may retain an `invite` query parameter.

In Vercel, the app accepts either of these public configuration pairs:

| URL                        | Public browser key                                                        |
| -------------------------- | ------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`        | `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`               |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_URL`             | `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`                         |

Only the selected public URL and browser key are injected. Database connection strings, service-role keys and Google secrets are excluded. Redeploy after changing environment variables. Existing connected Supabase integration variables can be used without duplicating them under Vite names.

## 4. Bring everyone into one team

1. The captain selects **Continue with Google**, then **Create team** and fills in the team profile once.
2. In Team settings → Invites, copy the invite link.
3. Members open that same link, sign in with their own Google account, and complete their name, grade, sub-teams and requested role. The invite code survives the Google round-trip.
4. A captain or coach approves requests in Team settings → Members.
5. Approved members enter the same shared database-backed workspace. Returning members go directly to their approved team.

Creating separate teams creates separate workspaces. Members should use **Join team**, which is the default for new accounts, rather than creating another team. Google identity never grants Captain or Coach permissions automatically.

## Verification

- The build and automated authentication tests cover Google request options, invite persistence/expiry, callback errors, public environment aliases and secret rejection.
- Rendering checks verify that Google login appears on the login/invite screens, is absent from the pending-approval screen, and signed-in new members see the join form with their Google name prefilled.
- Live Google consent, returning-session persistence, captain creation and approval from separate accounts must be checked after the provider and tables are configured.
- Browser inspection could not continue because Windows computer use could not verify Chrome's current URL. No browser-based sign-in or provider configuration was performed.
