import { createClient } from '@supabase/supabase-js';
import { publicSupabaseConfig } from '../src/public-env.js';
import { inviteEmailHtml } from './invite-email.js';

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
  const webAppUrl = process.env.GOOGLE_INVITE_WEB_APP_URL;
  const secret = process.env.GOOGLE_INVITE_SECRET;
  if (!webAppUrl || !secret)
    return res.status(503).json({
      error:
        'Email sending is not configured yet. Ask the site owner to connect the team Gmail account.',
    });
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(webAppUrl))
    return res.status(503).json({ error: 'The Google mail connection URL is invalid.' });
  const base = process.env.SITE_URL || 'https://tesm-tracker-furu.vercel.app';
  const invite = new URL('/', base);
  invite.searchParams.set('invite', team.join_code);
  const safeName = team.name.replace(/[\r\n]/g, ' ').slice(0, 100);
  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        secret,
        email,
        teamName: safeName,
        inviteUrl: invite.toString(),
        htmlBody: inviteEmailHtml(safeName, invite.toString(), team.join_code),
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true)
      return res.status(502).json({
        error:
          'Google could not send the invitation. Check the Apps Script deployment and Gmail quota.',
      });
    return res.status(200).json({ sent: true });
  } catch {
    return res.status(502).json({ error: 'The email service is unavailable. Try again shortly.' });
  }
}
