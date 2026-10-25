const INVITE_KEY = 'cnp-join-intent';
const VALID_CODE = /^[a-z0-9-]{4,64}$/i;
export function normalizeInvite(value) {
  const code = String(value || '')
    .trim()
    .toUpperCase();
  return VALID_CODE.test(code) ? code : '';
}
export function readInvite(search, storage, now = Date.now()) {
  const fromURL = normalizeInvite(new URLSearchParams(search).get('invite'));
  if (fromURL) return fromURL;
  try {
    const saved = JSON.parse(storage?.getItem(INVITE_KEY) || 'null');
    if (saved && now >= saved.at && now - saved.at < 86400000) return normalizeInvite(saved.code);
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  return '';
}
export function rememberInvite(code, storage, now = Date.now()) {
  const valid = normalizeInvite(code);
  try {
    if (valid) storage?.setItem(INVITE_KEY, JSON.stringify({ code: valid, at: now }));
    else storage?.removeItem(INVITE_KEY);
  } catch {
    /* The callback URL also carries the invite. */
  }
  return valid;
}
export function clearInvite(storage) {
  try {
    storage?.removeItem(INVITE_KEY);
  } catch {}
}
export function googleRedirect(origin, invite) {
  const url = new URL('/', origin);
  if (!['http:', 'https:'].includes(url.protocol)) throw Error('Invalid sign-in address.');
  url.searchParams.set('auth', 'callback');
  const code = normalizeInvite(invite);
  if (code) url.searchParams.set('invite', code);
  return url.toString();
}
export function callbackError(search, hash) {
  const query = new URLSearchParams(search),
    fragment = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const error = query.get('error') || fragment.get('error');
  if (!error) return '';
  if (error === 'access_denied')
    return 'Google sign-in was cancelled or access was declined. You can try again.';
  return 'Google sign-in could not finish. Please try again or contact your captain.';
}
export async function signInWithGoogle(client, { origin, invite, storage }) {
  if (!client)
    throw Error(
      'Google sign-in is not connected yet. Configure Supabase and enable its Google provider.',
    );
  const code = rememberInvite(invite, storage);
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: googleRedirect(origin, code),
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) {
    if (/provider.*(?:not enabled|disabled)|unsupported provider/i.test(error.message || ''))
      throw Error(
        'Google sign-in is not enabled for this workspace yet. Ask your captain to finish Google setup.',
      );
    throw error;
  }
  return data;
}
