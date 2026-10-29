import { createClient } from '@supabase/supabase-js';
import { publicSupabaseConfig } from '../src/public-env.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const teamId = String(req.body?.teamId || '');
  if (!token) return res.status(401).json({ error: 'Sign in first.' });
  if (!emailPattern.test(email) || email.length > 254 || !/^[0-9a-f-]{36}$/i.test(teamId))
    return res.status(400).json({ error: 'Enter a valid email address.' });
  const { url, key } = publicSupabaseConfig(process.env);
  if (!url || !key) return res.status(503).json({ error: 'Team invitations are not configured.' });
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: userResult, error: authError } = await client.auth.getUser(token);
  if (authError || !userResult?.user) return res.status(401).json({ error: 'Sign in again.' });
  const { data: member, error: memberError } = await client
    .from('memberships')
    .select('role,status')
    .eq('team_id', teamId)
    .eq('user_id', userResult.user.id)
    .single();
  if (memberError || member?.status !== 'approved' || !['Captain', 'Coach'].includes(member.role))
    return res.status(403).json({ error: 'Only captains and coaches can invite teammates.' });
  const { data: team, error: teamError } = await client
    .from('teams')
    .select('name,join_code')
    .eq('id', teamId)
    .single();
  if (teamError || !team) return res.status(404).json({ error: 'Team not found.' });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_FROM_EMAIL;
  if (!apiKey || !from)
    return res
      .status(503)
      .json({
        error:
          'Email sending is not configured yet. Ask the site owner to set RESEND_API_KEY and INVITE_FROM_EMAIL.',
      });
  const base = process.env.SITE_URL || 'https://tesm-tracker-furu.vercel.app';
  const invite = new URL('/', base);
  invite.searchParams.set('invite', team.join_code);
  const safeName = team.name.replace(/[\r\n]/g, ' ').slice(0, 100);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Join ${safeName} on FTC Team Tracker`,
        text: `${safeName} invited you to join their team workspace.\n\nOpen this link to join: ${invite}\n\nYou can sign in with Google or email. A captain or coach will approve your request.`,
      }),
    });
    if (!response.ok)
      return res
        .status(502)
        .json({
          error:
            'The email service could not send this invitation. Check the sender configuration and try again.',
        });
    return res.status(200).json({ sent: true });
  } catch {
    return res.status(502).json({ error: 'The email service is unavailable. Try again shortly.' });
  }
}
