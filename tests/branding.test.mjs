import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { seasonBadge, teamMonogram, teamPageTitle } from '../src/branding.js';

test('workspace branding follows the signed-in team', () => {
  assert.equal(teamMonogram('Cool Name Pending'), 'CNP');
  assert.equal(teamMonogram('kmo'), 'KMO');
  assert.equal(
    teamPageTitle({ name: 'Another Team', number: '12345' }),
    'Another Team #12345 • FTC Manager',
  );
  assert.equal(seasonBadge('2026–27 BIOBUZZ').years, '26/27');
  assert.equal(seasonBadge('2027-28 Next Game').label, 'Next Game');
});

test('the pre-sign-in page is not branded for the demo team', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const auth = await readFile(new URL('../src/Auth.jsx', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const views = await readFile(new URL('../src/Views.jsx', import.meta.url), 'utf8');
  assert.equal(teamPageTitle(null), 'FTC Manager • Sign in or sign up');
  assert.doesNotMatch(html + auth + app + views, /30439|Cool Name Pending/i);
});
