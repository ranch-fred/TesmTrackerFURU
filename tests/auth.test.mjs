import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeInvite,
  readInvite,
  rememberInvite,
  clearInvite,
  googleRedirect,
  callbackError,
  signInWithGoogle,
} from '../src/auth-flow.js';
import { publicSupabaseConfig } from '../src/public-env.js';
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
}
test('Invite codes survive the Google round-trip without trusting arbitrary redirects', () => {
  const storage = memoryStorage();
  rememberInvite(' abc123 ', storage, 100);
  assert.equal(readInvite('', storage, 101), 'ABC123');
  assert.equal(readInvite('?invite=NEW456', storage, 101), 'NEW456');
  assert.equal(
    googleRedirect('https://team.example', 'ABC123'),
    'https://team.example/?auth=callback&invite=ABC123',
  );
  assert.equal(normalizeInvite('https://evil.example'), '');
  assert.throws(() => googleRedirect('javascript:alert(1)', 'ABC123'));
});
test('Expired and malformed saved invites are ignored, and join intent can be cleared', () => {
  const storage = memoryStorage();
  rememberInvite('ABC123', storage, 10);
  assert.equal(readInvite('', storage, 86400011), '');
  clearInvite(storage);
  assert.equal(readInvite('', storage, 20), '');
  assert.equal(readInvite('', { getItem: () => '{bad json' }), '');
  assert.equal(
    readInvite('?invite=ABC123', {
      getItem: () => {
        throw Error('blocked');
      },
    }),
    'ABC123',
  );
});
test('Google sign-in uses the configured client and preserves the team invite', async () => {
  let request;
  const client = {
    auth: {
      signInWithOAuth: async (value) => {
        request = value;
        return { data: { url: 'https://accounts.google.com' }, error: null };
      },
    },
  };
  await signInWithGoogle(client, {
    origin: 'https://team.example',
    invite: 'JOIN123',
    storage: memoryStorage(),
  });
  assert.equal(request.provider, 'google');
  assert.equal(request.options.redirectTo, 'https://team.example/?auth=callback&invite=JOIN123');
  assert.equal(request.options.queryParams.prompt, 'select_account');
  assert.equal(request.options.scopes, undefined);
});
test('Missing configuration and provider errors do not create fake sessions', async () => {
  await assert.rejects(
    () => signInWithGoogle(null, { origin: 'https://team.example' }),
    /not connected/,
  );
  await assert.rejects(
    () =>
      signInWithGoogle(
        { auth: { signInWithOAuth: async () => ({ error: Error('Provider disabled') }) } },
        { origin: 'https://team.example' },
      ),
    /not enabled/,
  );
});
test('Callback errors show safe messages without exposing provider details or tokens', () => {
  assert.match(callbackError('?error=access_denied', ''), /cancelled/);
  assert.equal(callbackError('', ''), '');
  assert.ok(
    !callbackError('?error=server_error&error_description=private-token', '').includes(
      'private-token',
    ),
  );
});
test('Vercel integration public environment aliases resolve without including server secrets', () => {
  assert.deepEqual(
    publicSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://sample.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
      SUPABASE_SERVICE_ROLE_KEY: 'secret',
      POSTGRES_URL: 'postgres://private',
    }),
    { url: 'https://sample.supabase.co', key: 'public-key' },
  );
  assert.deepEqual(publicSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: 'secret' }), {
    url: '',
    key: '',
  });
  assert.throws(
    () => publicSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private' }),
    /never a secret/,
  );
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  assert.throws(
    () => publicSupabaseConfig({ SUPABASE_ANON_KEY: `header.${payload}.signature` }),
    /Service-role/,
  );
});
