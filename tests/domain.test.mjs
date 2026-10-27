import test from 'node:test';
import assert from 'node:assert/strict';
import {
  finance,
  attendance,
  legality,
  canEdit,
  canDelete,
  canView,
  csvText,
  trend,
} from '../src/domain.js';
import { parseCSV, validateImport } from '../src/importer.js';
test('Finance includes received funds only and preserves decimal precision', () => {
  const f = finance({
    income: [
      { received: 100, pledged: 500 },
      { received: 25.5, pledged: 25.5 },
    ],
    expenses: [{ amount: 20.5 }, { amount: 5 }],
  });
  assert.deepEqual(f, { received: 125.5, pledged: 525.5, spent: 25.5, balance: 100 });
});
test('Attendance derives presence and hours from the selected sessions', () => {
  const a = attendance('A', [
    { date: '2026-10-01', start: '16:00', end: '18:30', attendees: ['A'] },
    { date: '2026-10-02', start: '16:00', end: '18:00', attendees: [] },
  ]);
  assert.equal(a.percent, 50);
  assert.equal(a.hours, 2.5);
  assert.equal(a.streak, 0);
});
test('Unverified limits never produce a legality pass', () => {
  assert.deepEqual(legality({}, [], { verified: false }), { verified: false, checks: [] });
});
test('Missing robot measurements cannot produce a verified pass', () => {
  const r = legality({}, [], {
    verified: true,
    motors: 8,
    servos: 12,
    cube: 18,
    horizontal: 42,
    vertical: 48,
  });
  assert.equal(r.pass, false);
  assert.equal(r.checks.find((c) => c.name === 'Starting size').actual, 'Missing');
});
test('Legality compares hardware counts, size and both extension envelopes', () => {
  const r = legality(
    { length: 18, width: 18, height: 17, horizontal: 50, vertical: 30 },
    [{ kind: 'DC motor' }, { kind: 'Servo' }],
    { verified: true, motors: 8, servos: 12, cube: 18, horizontal: 42, vertical: 48 },
  );
  assert.equal(r.pass, false);
  assert.equal(r.checks.find((c) => c.name === 'Horizontal envelope').pass, false);
  assert.equal(r.checks.find((c) => c.name === 'Starting size').pass, true);
});
test('Roles enforce read-only sponsors and optional mentor editing', () => {
  assert.equal(canEdit('Parent/Sponsor'), false);
  assert.equal(canEdit('Mentor'), false);
  assert.equal(canEdit('Mentor', true), true);
  assert.equal(canDelete('Member'), false);
  assert.equal(canDelete('Coach'), true);
  assert.equal(canView('Parent/Sponsor', 'roster'), false);
  assert.equal(canView('Parent/Sponsor', 'finance'), true);
  assert.equal(canView('Parent/Sponsor', 'logs'), true);
});
test('CSV escapes formulas, quotes and multiline values', () => {
  const fields = [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
  ];
  const text = csvText([{ a: '=SUM(A1:A2)', b: 'one "quoted"\nline' }], fields);
  assert.ok(text.includes("'=SUM"));
  assert.ok(text.includes('""quoted""'));
  assert.deepEqual(parseCSV(text, fields), [{ a: "'=SUM(A1:A2)", b: 'one "quoted"\nline' }]);
});
test('CSV import converts field types and member lists', () => {
  const fields = [
    { key: 'n', label: 'Number', type: 'number' },
    { key: 'ok', label: 'Checked', type: 'checkbox' },
    { key: 'people', label: 'Attendees', type: 'members' },
  ];
  assert.deepEqual(parseCSV('Number,Checked,Attendees\n3,true,"A; B"', fields), [
    { n: 3, ok: true, people: ['A', 'B'] },
  ]);
});
test('Import refuses unknown sections, invalid money and out-of-range percentages', () => {
  assert.throws(() => validateImport({ memberships: [] }));
  assert.throws(() => validateImport({ expenses: [{ amount: -1 }] }));
  assert.throws(() => validateImport({ matches: [{ intake: 101 }] }));
  assert.throws(() => validateImport({ expenses: [{ amount: 'not money' }] }));
  assert.deepEqual(
    validateImport({ expenses: [{ description: 'Parts', amount: 20, role: 'Captain' }] }),
    { expenses: [{ description: 'Parts', amount: 20 }] },
  );
});
test('Trend groups same-day amounts and keeps cumulative balances', () => {
  assert.deepEqual(
    trend({
      income: [{ lastContact: '2026-10-01', received: 100 }],
      expenses: [
        { date: '2026-10-01', amount: 20 },
        { date: '2026-10-02', amount: 5 },
      ],
    }),
    [
      { date: '10-01', raised: 100, spent: 20, balance: 80 },
      { date: '10-02', raised: 100, spent: 25, balance: 75 },
    ],
  );
});
