import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleNav, isMoreActive, mainNav, logNav, moreNav } from '../src/nav.js';

test('team members see every sidebar entry', () => {
  const v = visibleNav('Member');
  assert.equal(v.main.length, mainNav.length);
  assert.equal(v.logs.length, logNav.length);
  assert.equal(v.more.length, moreNav.length);
  assert.ok(v.main.some((i) => i.id === 'roster'));
});

test('sponsors only see home, announcements, funds, outreach and resources', () => {
  const v = visibleNav('Parent/Sponsor');
  assert.deepEqual(
    v.main.map((i) => i.id),
    ['dashboard', 'announcements', 'finance'],
  );
  assert.deepEqual(
    v.logs.map((i) => i.id),
    ['outreach'],
  );
  assert.deepEqual(
    v.more.map((i) => i.id),
    ['resources'],
  );
});

test('More menu opens for its own pages only', () => {
  assert.equal(isMoreActive('purchases'), true);
  assert.equal(isMoreActive('finance'), false);
});
