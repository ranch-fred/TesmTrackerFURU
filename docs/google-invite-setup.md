# Send team invitations with Gmail

The roster's **Add teammate** button uses a Google Apps Script web app to send the join link from a team Gmail account. No paid email service or custom domain is needed. Google currently limits personal accounts to 100 recipients per day; check [Google's quota page](https://developers.google.com/apps-script/guides/services/quotas) for current limits.

1. Sign in to the Gmail account that should send invitations. Open [script.google.com](https://script.google.com/) and create a **New project**.
2. Replace the editor's `Code.gs` contents with [`scripts/google-invite.gs`](../scripts/google-invite.gs), then save the project.
3. Choose `createInviteSecret` from the function menu and click **Run**. Approve the requested access. Open **Execution log**, copy the generated secret, and keep it private. The function creates the secret only once.
4. Choose `authorizeMail` and click **Run**. Approve Gmail sending access. The log should show the remaining daily recipient quota.
5. Click **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and **Who has access** to **Anyone**. Deploy and copy the URL ending in `/exec`. The web app checks the secret on every request; do not put this URL or secret in client code.
6. In the Vercel project, open **Settings → Environment Variables**. Add `GOOGLE_INVITE_WEB_APP_URL` (the `/exec` URL) and `GOOGLE_INVITE_SECRET` (the value from step 3) for **Production**. Do not prefix these names with `VITE_`.
7. Open **Deployments** in Vercel and redeploy the latest production deployment so the new settings take effect.
8. Sign in as a captain or coach. Open **Attendance & roster → Team roster → Add teammate**, enter an email address you can check, and send a test invitation.

If sending fails, check the Apps Script **Executions** log, confirm the deployment is still available to **Anyone**, and confirm both Vercel values match. If you edit the script later, create a new deployment version and update or redeploy as needed.
