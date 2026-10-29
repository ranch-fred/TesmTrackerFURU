import test from 'node:test';
import assert from 'node:assert/strict';
import {
  linkedTo,
  mechanismSummary,
  layoutChart,
  safeUrl,
  makeMechanismEntry,
  STAGES,
} from '../src/mechanisms.js';

const mech = {
  id: 'm1',
  name: 'Intake',
  parts: [{ id: 'p', name: 'IntakeController', done: true }],
};
const member = { name: 'Avery' };

test('entries link by id, and by name only when they have no id', () => {
  const rows = [
    { id: 1, mechanismId: 'm1' },
    { id: 2, subsystem: 'Intake' },
    { id: 3, subsystem: 'Intake', mechanismId: 'other' },
    { id: 4, subsystem: 'Lift' },
  ];
  assert.deepEqual(
    linkedTo(rows, mech).map((r) => r.id),
    [1, 2],
  );
});

test('stage status follows entries and the done toggle', () => {
  const data = { designs: [], build: [{ mechanismId: 'm1' }], programming: [], hardware: [] };
  const s = mechanismSummary({ ...mech, done: { build: true } }, data);
  assert.equal(s.cad.status, 'empty');
  assert.equal(s.build.status, 'done');
  assert.equal(s.parts.status, 'done');
  assert.equal(s.readyForCode, true);
  assert.equal(mechanismSummary(mech, data).build.status, 'active');
});

test('chart layout has one node per stage per mechanism and connects them in order', () => {
  const { nodes, links, width, height } = layoutChart(3);
  assert.equal(nodes.length, 3 * STAGES.length);
  assert.equal(links.length, 3 * STAGES.length);
  assert.ok(width > 0 && height > 0);
  assert.equal(layoutChart(0).nodes.length, 0);
});

test('only http and https links are accepted', () => {
  assert.equal(safeUrl('https://drive.google.com/file/d/1'), 'https://drive.google.com/file/d/1');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('not a link'), '');
});

test('log forms create linked records and reject bad input', () => {
  const build = makeMechanismEntry(
    'build',
    mech,
    { date: '2026-10-29', whatDone: 'Mounted rollers' },
    member,
    'u1',
  );
  assert.equal(build.mechanismId, 'm1');
  assert.equal(build.subsystem, 'Intake');
  assert.equal(build.author, 'Avery');
  const code = makeMechanismEntry(
    'code',
    mech,
    {
      date: '2026-10-29',
      whatDone: 'Tuned power',
      github: 'https://github.com/a/b',
      snippet: ' motor.setPower(1); ',
    },
    member,
    'u1',
  );
  assert.equal(code.snippet, 'motor.setPower(1);');
  assert.equal(code.github, 'https://github.com/a/b');
  assert.throws(
    () => makeMechanismEntry('cad', mech, { title: '' }, member, 'u1'),
    /Name this CAD/,
  );
  assert.throws(
    () => makeMechanismEntry('cad', mech, { title: 'Lift', link: 'javascript:x' }, member, 'u1'),
    /https/,
  );
  const cad = makeMechanismEntry(
    'cad',
    mech,
    { title: 'Intake v2', link: 'https://drive.google.com/x' },
    member,
    'u1',
  );
  assert.equal(cad.cadLink, 'https://drive.google.com/x');
});
