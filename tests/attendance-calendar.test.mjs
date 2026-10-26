import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approvedMembers,
  attendanceStatus,
  checkinsForMember,
  monthDays,
  monthKey,
} from '../src/attendance.js';

test('Saturday and Sunday become missed only after the local day ends', () => {
  const saturday = { key: '2026-10-24', mandatory: true };
  const sunday = { key: '2026-10-25', mandatory: true };
  assert.equal(attendanceStatus(saturday, '2026-10-26', false, '2026-10-01'), 'missed');
  assert.equal(attendanceStatus(sunday, '2026-10-25', false, '2026-10-01'), 'today');
  assert.equal(attendanceStatus(sunday, '2026-10-26', true, '2026-10-01'), 'present-required');
  assert.equal(attendanceStatus(saturday, '2026-10-26', false, '2026-10-25'), 'inactive');
});

test('optional weekday attendance has its own color status', () => {
  const monday = { key: '2026-10-26', mandatory: false };
  assert.equal(attendanceStatus(monday, '2026-10-26', true, null), 'present-extra');
  assert.equal(attendanceStatus(monday, '2026-10-27', false, null), 'optional');
});

test('calendar boundaries and signed-in roster membership are stable', () => {
  assert.equal(monthKey(2026, 12), '2027-01');
  const october = monthDays(2026, 9);
  assert.equal(october.find((day) => day?.key === '2026-10-24').mandatory, true);
  assert.equal(october.find((day) => day?.key === '2026-10-26').mandatory, false);
  assert.deepEqual(approvedMembers([{ status: 'approved' }, { status: 'pending' }]), [
    { status: 'approved' },
  ]);
});

test('check-ins identify members by account, not matching names', () => {
  const rows = [
    {
      date: '2026-10-25',
      attendanceCheckin: true,
      attendanceUserId: 'user-a',
      attendees: ['Alex'],
    },
    {
      date: '2026-10-26',
      attendanceCheckin: true,
      attendanceUserId: 'user-b',
      attendees: ['Alex'],
    },
  ];
  assert.deepEqual(
    [...checkinsForMember(rows, { user_id: 'user-a', name: 'Alex' })],
    ['2026-10-25'],
  );
});
