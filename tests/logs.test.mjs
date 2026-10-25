import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, makeLogRecord, loggedToday } from '../src/logs.js';

const member = { name: 'Alex Chen' };
const userId = 'user-123';

test('local log date follows the member day', () => {
  assert.equal(localDate(new Date(2026, 9, 25, 23, 30)), '2026-10-25');
});

test('quick entries keep the member, date, and work in every log', () => {
  for (const kind of ['programming', 'build', 'outreach']) {
    const entry = makeLogRecord(
      kind,
      {
        date: '2026-10-25',
        whatDone: '  Tested intake  ',
        place: 'Library',
        gained: 'New mentors',
      },
      member,
      userId,
    );
    assert.equal(entry.date, '2026-10-25');
    assert.equal(entry.whatDone, 'Tested intake');
    assert.equal(entry.loggedById, userId);
    assert.equal(entry.author, member.name);
  }
  assert.throws(() =>
    makeLogRecord('build', { date: '2026-10-25', whatDone: ' ' }, member, userId),
  );
  assert.throws(() =>
    makeLogRecord('outreach', { date: '2026-10-25', whatDone: 'Demo' }, member, userId),
  );
});

test('daily reminder checks the current member only', () => {
  const data = {
    programming: [],
    build: [{ date: '2026-10-25', whatDone: 'Cut parts', loggedById: userId }],
    outreach: [],
  };
  assert.equal(loggedToday(data, member, userId, '2026-10-25'), true);
  assert.equal(loggedToday(data, member, 'another-user', '2026-10-25'), false);
  assert.equal(loggedToday(data, member, userId, '2026-10-26'), false);
});
